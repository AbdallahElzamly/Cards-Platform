'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import {
  CardSocialLinks,
  CardStatus,
  CardSurfaceTheme,
  parseSocialLinks,
} from '@/types/smart-cards';

function normalizeSocialUrl(
  raw: string | null | undefined,
  platform?: 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'telegram'
): string | undefined {
  const val = (raw || '').trim();
  if (!val) return undefined;
  if (/^https?:\/\//i.test(val)) return val;

  const cleanHandle = val.replace(/^@+/, '');
  if (!val.includes('.') && !val.includes('/')) {
    if (platform === 'instagram') return `https://www.instagram.com/${cleanHandle}`;
    if (platform === 'tiktok') return `https://www.tiktok.com/@${cleanHandle}`;
    if (platform === 'telegram') return `https://t.me/${cleanHandle}`;
    if (platform === 'facebook') return `https://www.facebook.com/${cleanHandle}`;
    if (platform === 'linkedin') return `https://www.linkedin.com/in/${cleanHandle}`;
  }

  return `https://${val}`;
}

function sanitizeAvatarUrl(raw: string | null | undefined): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed) && trimmed.length <= 4_200_000) {
    return trimmed;
  }
  return null;
}

function getErrMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function generateRandomSixCharCode(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getAuthenticatedUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error('getAuthenticatedUser error:', err);
    return null;
  }
}

async function canUserManageCard(
  user: { id: string; email?: string | null },
  card: { id: string; owner_id: string | null; batch_name: string | null }
): Promise<boolean> {
  if (card.owner_id && card.owner_id === user.id) return true;
  if (isSuperAdminEmail(user.email)) return true;

  if (user.email && card.batch_name && card.batch_name !== 'SELF_INDIVIDUAL') {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('batch_name', card.batch_name)
      .ilike('contact_email', user.email.trim())
      .maybeSingle();

    if (company) return true;
  }

  return false;
}

/**
 * Guided Individual Onboarding Wizard Action:
 * Creates strictly AT MOST 1 personal starter card per individual user (zero bulk/free-minting abuse).
 */
export async function createPersonalStarterCardAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  slug?: string;
  code?: string;
}> {
  const user = await getAuthenticatedUser();
  if (!user || !user.email) {
    return { success: false, error: 'يرجى تسجيل الدخول أولاً.' };
  }

  try {
    // Hard Quota Enforcement (Team 4 & Team 5 Lock): Max 1 starter card when user owns 0 cards
    const { count: ownedCount, error: countErr } = await supabaseAdmin
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    if (countErr) throw countErr;

    if ((ownedCount || 0) > 0 && !isSuperAdminEmail(user.email)) {
      return {
        success: false,
        error: 'لديك بطاقة مفعّلة بالفعل في حسابك. لإضافة بطاقة مطبوعة جديدة، استخدم كود التفعيل المطبوع عليها.',
      };
    }

    const fullName = (formData.get('full_name')?.toString() || '').trim();
    if (!fullName) {
      return { success: false, error: 'يرجى كتابة اسمك الكامل.' };
    }

    const jobTitle = (formData.get('job_title')?.toString() || '').trim() || null;
    const company = (formData.get('company')?.toString() || '').trim() || null;
    const bio = (formData.get('bio')?.toString() || '').trim() || null;
    const phone = (formData.get('phone')?.toString() || '').trim() || null;
    const phone2 = (formData.get('phone2')?.toString() || '').trim() || undefined;
    const whatsapp = (formData.get('whatsapp')?.toString() || '').trim() || phone || null;
    const email = (formData.get('email')?.toString() || '').trim() || user.email;
    const surfaceTheme =
      (formData.get('surface_theme')?.toString() as CardSurfaceTheme) || 'obsidian';

    const socialLinks: CardSocialLinks = {
      phone2,
      linkedin: normalizeSocialUrl(formData.get('linkedin')?.toString(), 'linkedin'),
      instagram: normalizeSocialUrl(formData.get('instagram')?.toString(), 'instagram'),
      facebook: normalizeSocialUrl(formData.get('facebook')?.toString(), 'facebook'),
      surface_theme: surfaceTheme,
    };

    // Insert card with automatic collision retry on 6-char code
    let createdCard: { id: string; code: string } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidateCode = generateRandomSixCharCode();
      const { data, error } = await supabaseAdmin
        .from('cards')
        .insert({
          code: candidateCode,
          owner_id: user.id,
          product: 'business',
          status: 'active',
          batch_name: 'SELF_INDIVIDUAL',
        })
        .select('id, code')
        .single();

      if (!error && data) {
        createdCard = data;
        break;
      }
      if (error && error.code !== '23505') {
        throw error;
      }
    }

    if (!createdCard) {
      return { success: false, error: 'تعذر حجز كود فريد للبطاقة، يرجى المحاولة مرة أخرى.' };
    }

    const cleanAscii = fullName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const slug = `${cleanAscii || `card-${createdCard.code.toLowerCase()}`}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const { error: bcErr } = await supabaseAdmin.from('business_cards').insert({
      card_id: createdCard.id,
      slug,
      full_name: fullName,
      job_title: jobTitle,
      company,
      bio,
      phone,
      whatsapp,
      email,
      theme_color: '#181818',
      social_links: socialLinks,
      is_active: true,
    });

    if (bcErr) {
      // Atomic rollback of parent card row on failure
      await supabaseAdmin.from('cards').delete().eq('id', createdCard.id);
      throw bcErr;
    }

    revalidatePath('/dashboard');
    revalidatePath(`/c/${slug}`);

    return { success: true, slug, code: createdCard.code };
  } catch (err: unknown) {
    console.error('createPersonalStarterCardAction error:', err);
    return { success: false, error: getErrMsg(err, 'تعذر إنشاء بطاقتك الشخصية.') };
  }
}

export async function updateBusinessCardAction(
  cardId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; slug?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
  }

  try {
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id, code, owner_id, batch_name, status')
      .eq('id', cardId)
      .single();

    if (!card || !(await canUserManageCard(user, card))) {
      return { success: false, error: 'غير مصرح لك بتعديل هذا الكارت.' };
    }

    if (card.status === 'suspended' && !isSuperAdminEmail(user.email)) {
      return { success: false, error: 'هذا الكارت موقوف من الإدارة ولا يمكن تعديله حالياً.' };
    }

    const { data: existingBc } = await supabaseAdmin
      .from('business_cards')
      .select('*')
      .eq('card_id', cardId)
      .maybeSingle();

    const fullName = (formData.get('full_name')?.toString() || '').trim() || 'صاحب الكارت';
    const jobTitle = (formData.get('job_title')?.toString() || '').trim();
    const company = (formData.get('company')?.toString() || '').trim();
    const bio = (formData.get('bio')?.toString() || '').trim();
    const phone = (formData.get('phone')?.toString() || '').trim();
    const whatsapp = (formData.get('whatsapp')?.toString() || '').trim();
    const email = (formData.get('email')?.toString() || '').trim();
    const website = normalizeSocialUrl(formData.get('website')?.toString()) || '';
    const vodafoneCash = (formData.get('vodafone_cash')?.toString() || '').trim();
    const instapayUrl = normalizeSocialUrl(formData.get('instapay_url')?.toString()) || '';
    const themeColor = formData.get('theme_color')?.toString() || existingBc?.theme_color || '#181818';
    const avatarUrlRaw = formData.get('avatar_url')?.toString();
    const socialLinksJson = formData.get('social_links_json')?.toString();

    const prevSocials = parseSocialLinks(existingBc?.social_links);
    let parsedClientSocials: CardSocialLinks = {};
    if (socialLinksJson) {
      try {
        parsedClientSocials = parseSocialLinks(JSON.parse(socialLinksJson));
      } catch {
        // ignore malformed json
      }
    }

    // Security Strip: Never allow client JSON to inject admin_provisioned
    delete parsedClientSocials.admin_provisioned;

    const mergedSocials: CardSocialLinks = {
      ...prevSocials,
      visible_fields: parsedClientSocials.visible_fields ?? prevSocials.visible_fields,
      surface_theme: parsedClientSocials.surface_theme ?? prevSocials.surface_theme,
    };

    const socialFieldKeys = [
      'phone2',
      'linkedin',
      'facebook',
      'instagram',
      'tiktok',
      'telegram',
      'x',
      'youtube',
      'github',
      'behance',
      'location_url',
      'custom_link_title',
      'custom_link_url',
      'surface_theme',
    ] as const;

    for (const key of socialFieldKeys) {
      if (formData.has(key)) {
        const rawVal = (formData.get(key)?.toString() || '').trim();
        if (key === 'surface_theme') {
          mergedSocials.surface_theme = (rawVal as CardSurfaceTheme) || undefined;
        } else if (key === 'phone2' || key === 'custom_link_title') {
          mergedSocials[key] = rawVal || undefined;
        } else if (
          key === 'linkedin' ||
          key === 'instagram' ||
          key === 'facebook' ||
          key === 'tiktok' ||
          key === 'telegram'
        ) {
          mergedSocials[key] = normalizeSocialUrl(rawVal, key);
        } else {
          mergedSocials[key] = normalizeSocialUrl(rawVal);
        }
      }
    }

    let finalSlug = existingBc?.slug || '';

    if (existingBc?.id) {
      const updatePayload: Record<string, unknown> = {
        full_name: fullName,
        job_title: jobTitle || null,
        company: company || null,
        bio: bio || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        website: website || null,
        vodafone_cash: vodafoneCash || null,
        instapay_url: instapayUrl || null,
        theme_color: themeColor,
        social_links: mergedSocials,
        is_active: true,
      };

      if (avatarUrlRaw !== undefined) {
        updatePayload.avatar_url = sanitizeAvatarUrl(avatarUrlRaw);
      }

      const { error } = await supabaseAdmin
        .from('business_cards')
        .update(updatePayload)
        .eq('id', existingBc.id);

      if (error) throw error;
    } else {
      const cleanAscii = fullName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      finalSlug = `${cleanAscii || `card-${card.code.toLowerCase()}`}-${Math.floor(100 + Math.random() * 900)}`;

      const { error } = await supabaseAdmin.from('business_cards').insert({
        card_id: cardId,
        slug: finalSlug,
        full_name: fullName,
        job_title: jobTitle || null,
        company: company || null,
        bio: bio || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        website: website || null,
        vodafone_cash: vodafoneCash || null,
        instapay_url: instapayUrl || null,
        theme_color: themeColor,
        avatar_url: sanitizeAvatarUrl(avatarUrlRaw),
        social_links: mergedSocials,
        is_active: true,
      });

      if (error) throw error;

      await supabaseAdmin
        .from('cards')
        .update({ status: 'active', product: 'business' })
        .eq('id', cardId);
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    if (finalSlug) revalidatePath(`/c/${finalSlug}`);

    return { success: true, slug: finalSlug };
  } catch (err: unknown) {
    console.error('updateBusinessCardAction error:', err);
    return { success: false, error: getErrMsg(err, 'فشل تحديث الكارت') };
  }
}

export async function updateReviewCardTargetUrlAction(
  cardId: string,
  targetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
  }

  try {
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id, owner_id, batch_name, status')
      .eq('id', cardId)
      .single();

    if (!card || !(await canUserManageCard(user, card))) {
      return { success: false, error: 'غير مصرح لك بتعديل هذا الكارت.' };
    }

    if (card.status === 'suspended' && !isSuperAdminEmail(user.email)) {
      return { success: false, error: 'هذا الكارت موقوف من الإدارة.' };
    }

    const normalized = normalizeSocialUrl(targetUrl);
    if (!normalized) {
      return { success: false, error: 'يرجى إدخال رابط صحيح.' };
    }

    const { error } = await supabaseAdmin
      .from('cards')
      .update({ target_url: normalized, status: 'active' })
      .eq('id', cardId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrMsg(err, 'فشل تحديث الرابط') };
  }
}

export async function updateCardStatusModeAction(
  cardId: string,
  status: CardStatus
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
  }

  try {
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id, owner_id, batch_name, status')
      .eq('id', cardId)
      .single();

    if (!card || !(await canUserManageCard(user, card))) {
      return { success: false, error: 'غير مصرح لك بتغيير حالة الكارت.' };
    }

    const isAdmin = isSuperAdminEmail(user.email);

    // Block non-admins from un-suspending admin-suspended cards or resetting to unclaimed
    if (!isAdmin) {
      if (card.status === 'suspended') {
        return { success: false, error: 'هذا الكارت موقوف من الإدارة ولا يمكن إعادة تفعيله إلا عبر الدعم.' };
      }
      if (status !== 'active' && status !== 'lost') {
        return { success: false, error: 'يمكنك التبديل فقط بين الوضع النشط ووضع الفقدان.' };
      }
    }

    const { error } = await supabaseAdmin
      .from('cards')
      .update({ status })
      .eq('id', cardId);

    if (error) throw error;

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrMsg(err, 'فشل تغيير حالة الكارت') };
  }
}

export async function reassignCardCustodyAction(
  cardId: string,
  formData: FormData,
  clearLeads: boolean,
  companySlugToRevalidate?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول بحساب مسؤول الشركة أولاً.' };
  }

  try {
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id, code, owner_id, batch_name')
      .eq('id', cardId)
      .single();

    if (!card || !(await canUserManageCard(user, card))) {
      return { success: false, error: 'غير مصرح لك بنقل عهدة هذا الكارت.' };
    }

    const { data: existingBc } = await supabaseAdmin
      .from('business_cards')
      .select('*')
      .eq('card_id', cardId)
      .maybeSingle();

    const fullName = (formData.get('full_name')?.toString() || '').trim() || 'موظف الشركة';
    const jobTitle = (formData.get('job_title')?.toString() || '').trim() || null;
    const companyName = (formData.get('company')?.toString() || '').trim() || existingBc?.company || null;
    const phone = (formData.get('phone')?.toString() || '').trim() || null;
    const whatsapp = (formData.get('whatsapp')?.toString() || '').trim() || phone || null;
    const email = (formData.get('email')?.toString() || '').trim() || null;
    const linkedin = normalizeSocialUrl(formData.get('linkedin')?.toString(), 'linkedin');
    const phone2 = (formData.get('phone2')?.toString() || '').trim() || undefined;

    const prevSocials = parseSocialLinks(existingBc?.social_links);
    const nextSocials: CardSocialLinks = {
      ...prevSocials,
      phone2: phone2 ?? prevSocials.phone2,
      linkedin: linkedin ?? prevSocials.linkedin,
      surface_theme: (prevSocials.surface_theme as CardSurfaceTheme) || 'obsidian',
    };

    let bcId = existingBc?.id;

    if (existingBc?.id) {
      const { error: upErr } = await supabaseAdmin
        .from('business_cards')
        .update({
          full_name: fullName,
          job_title: jobTitle,
          company: companyName,
          phone,
          whatsapp,
          email,
          social_links: nextSocials,
          is_active: true,
        })
        .eq('id', existingBc.id);

      if (upErr) throw upErr;
    } else {
      const slug = `emp-${card.code.toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const { data: insertedBc, error: insErr } = await supabaseAdmin
        .from('business_cards')
        .insert({
          card_id: cardId,
          slug,
          full_name: fullName,
          job_title: jobTitle,
          company: companyName,
          phone,
          whatsapp,
          email,
          theme_color: '#181818',
          social_links: nextSocials,
          is_active: true,
        })
        .select('id')
        .single();

      if (insErr) throw insErr;
      bcId = insertedBc?.id;
    }

    await supabaseAdmin
      .from('cards')
      .update({ status: 'active', product: 'business' })
      .eq('id', cardId);

    if (clearLeads && bcId) {
      await supabaseAdmin.from('card_leads').delete().eq('business_card_id', bcId);
    }

    revalidatePath('/dashboard');
    if (companySlugToRevalidate) revalidatePath(`/org/${companySlugToRevalidate}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('reassignCardCustodyAction error:', err);
    return { success: false, error: getErrMsg(err, 'فشل إعادة تعيين عهدة الكارت') };
  }
}

export async function transferCardOwnershipAction(
  cardId: string,
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user || !isSuperAdminEmail(user.email)) {
    return { success: false, error: 'نقل الملكية متاح لمشرف المنصة فقط.' };
  }

  try {
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id, owner_id, batch_name')
      .eq('id', cardId)
      .single();

    if (!card || card.batch_name === 'SELF_INDIVIDUAL') {
      return { success: false, error: 'لا يمكن نقل ملكية هذا الكارت.' };
    }

    const email = recipientEmail.trim().toLowerCase();
    if (!email) {
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني للعميل.' };
    }

    const { data: listUsersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    if (listErr) {
      return { success: false, error: 'تعذر البحث عن حساب العميل.' };
    }

    const recipient = listUsersData?.users?.find((u) => u.email?.toLowerCase() === email);
    if (!recipient) {
      return {
        success: false,
        error: `لا يوجد حساب مسجل بالبريد (${email}) بعد. أرسل رابط التفعيل للعميل لينشئ حسابه مباشرة.`,
      };
    }

    const { error: updateErr } = await supabaseAdmin
      .from('cards')
      .update({ owner_id: recipient.id })
      .eq('id', cardId);

    if (updateErr) throw updateErr;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    console.error('transferCardOwnershipAction error:', err);
    return { success: false, error: getErrMsg(err, 'فشل نقل ملكية الكارت') };
  }
}

/**
 * Claim a printed physical NFC card code into the user's personal account.
 * Rejects suspended/lost cards and corporate fleet cards.
 */
export async function claimCardByCodeInDashboardAction(
  rawCode: string,
  optionalInitialProfile?: {
    fullName?: string;
    jobTitle?: string;
    company?: string;
    phone?: string;
    whatsapp?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
  }

  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { success: false, error: 'يرجى إدخال كود الكارت.' };
  }

  try {
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (!card) {
      return { success: false, error: `الكود (${code}) غير مسجل في النظام.` };
    }

    if (card.status === 'suspended' || card.status === 'lost') {
      return { success: false, error: 'هذا الكارت موقوف أو مبلغ عن فقدانه.' };
    }

    const isCorporateBatch = Boolean(
      card.batch_name &&
        (card.batch_name.startsWith('CORP-') || card.batch_name.startsWith('ORG-'))
    );

    if (isCorporateBatch && !isSuperAdminEmail(user.email)) {
      return {
        success: false,
        error: 'هذا الكارت تابع لأسطول شركة ولا يمكن ربطه بحساب فردي.',
      };
    }

    const { data: existingBc } = await supabaseAdmin
      .from('business_cards')
      .select('*')
      .eq('card_id', card.id)
      .maybeSingle();

    const socials = parseSocialLinks(existingBc?.social_links);

    if (
      card.owner_id &&
      card.owner_id !== user.id &&
      !socials.admin_provisioned &&
      !isSuperAdminEmail(user.email)
    ) {
      return { success: false, error: 'هذا الكارت مفعل ومرتبط بحساب مستخدم آخر بالفعل.' };
    }

    const { error: upErr } = await supabaseAdmin
      .from('cards')
      .update({
        owner_id: user.id,
        status: 'active',
      })
      .eq('id', card.id);

    if (upErr) throw upErr;

    if (card.product === 'business' && !existingBc) {
      const slug = `card-${code.toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`;
      await supabaseAdmin.from('business_cards').insert({
        card_id: card.id,
        slug,
        full_name:
          optionalInitialProfile?.fullName?.trim() ||
          user.user_metadata?.full_name ||
          'بطاقتي الذكية',
        job_title: optionalInitialProfile?.jobTitle?.trim() || null,
        company: optionalInitialProfile?.company?.trim() || null,
        phone: optionalInitialProfile?.phone?.trim() || null,
        whatsapp:
          optionalInitialProfile?.whatsapp?.trim() ||
          optionalInitialProfile?.phone?.trim() ||
          null,
        email: user.email || null,
        theme_color: '#181818',
        social_links: { surface_theme: 'obsidian' },
        is_active: true,
      });
    } else if (existingBc && socials.admin_provisioned) {
      await supabaseAdmin
        .from('business_cards')
        .update({
          social_links: { ...socials, admin_provisioned: false },
        })
        .eq('id', existingBc.id);
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrMsg(err, 'تعذر ربط الكارت بالحساب.') };
  }
}
