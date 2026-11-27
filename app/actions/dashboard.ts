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

function normalizeOptionalUrl(raw: string | null | undefined): string | undefined {
  const val = (raw || '').trim();
  if (!val) return undefined;
  if (/^https?:\/\//i.test(val)) return val;
  return `https://${val}`;
}

function getErrMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function generateUnambiguousCode(existingCodes: Set<string>): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingCodes.has(code));
  existingCodes.add(code);
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

  if (user.email && card.batch_name) {
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
      .select('id, code, owner_id, batch_name')
      .eq('id', cardId)
      .single();

    if (!card || !(await canUserManageCard(user, card))) {
      return { success: false, error: 'غير مصرح لك بتعديل هذا الكارت.' };
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
    const website = normalizeOptionalUrl(formData.get('website')?.toString()) || '';
    const vodafoneCash = (formData.get('vodafone_cash')?.toString() || '').trim();
    const instapayUrl = normalizeOptionalUrl(formData.get('instapay_url')?.toString()) || '';
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

    const mergedSocials: CardSocialLinks = {
      ...prevSocials,
      ...parsedClientSocials,
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
        } else {
          mergedSocials[key] = normalizeOptionalUrl(rawVal);
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
        updatePayload.avatar_url = avatarUrlRaw.trim() || null;
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
        avatar_url: avatarUrlRaw?.trim() || null,
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
      .select('id, owner_id, batch_name')
      .eq('id', cardId)
      .single();

    if (!card || !(await canUserManageCard(user, card))) {
      return { success: false, error: 'غير مصرح لك بتعديل هذا الكارت.' };
    }

    const normalized = normalizeOptionalUrl(targetUrl);
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
      .select('id, owner_id, batch_name')
      .eq('id', cardId)
      .single();

    if (!card || !(await canUserManageCard(user, card))) {
      return { success: false, error: 'غير مصرح لك بتغيير حالة الكارت.' };
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
  companySlugForPortal?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();

  try {
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id, code, owner_id, batch_name')
      .eq('id', cardId)
      .single();

    if (!card) {
      return { success: false, error: 'الكارت غير موجود.' };
    }

    let authorized = false;
    if (user && (await canUserManageCard(user, card))) {
      authorized = true;
    } else if (companySlugForPortal && card.batch_name) {
      const { data: portalCompany } = await supabaseAdmin
        .from('companies')
        .select('id, batch_name')
        .eq('slug', companySlugForPortal)
        .eq('batch_name', card.batch_name)
        .maybeSingle();

      if (portalCompany) {
        authorized = true;
      }
    }

    if (!authorized) {
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
    const linkedin = normalizeOptionalUrl(formData.get('linkedin')?.toString());
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
    if (companySlugForPortal) revalidatePath(`/org/${companySlugForPortal}`);
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
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
  }

  try {
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id, owner_id, batch_name')
      .eq('id', cardId)
      .single();

    if (!card || !(await canUserManageCard(user, card))) {
      return { success: false, error: 'غير مصرح لك بنقل ملكية هذا الكارت.' };
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
        error: `لا يوجد حساب مسجل بالبريد (${email}) بعد. يمكنك إرسال رابط التفعيل للعميل لينشئ حسابه في خطوة واحدة.`,
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

export async function createSelfServeCompanyAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; slug?: string }> {
  const user = await getAuthenticatedUser();
  if (!user || !user.email) {
    return { success: false, error: 'يجب تسجيل الدخول لإنشاء مساحة الشركة.' };
  }

  try {
    const name = (formData.get('company_name')?.toString() || '').trim();
    if (!name) {
      return { success: false, error: 'يرجى إدخال اسم الشركة أو المؤسسة.' };
    }

    const cleanSlugBase =
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'company';

    const rand = Math.floor(1000 + Math.random() * 9000);
    const slug = `${cleanSlugBase}-${rand}`;
    const batchName = `ORG-${cleanSlugBase.toUpperCase().slice(0, 10)}-${rand}`;

    const { error } = await supabaseAdmin.from('companies').insert({
      name,
      slug,
      contact_email: user.email.toLowerCase(),
      batch_name: batchName,
    });

    if (error) throw error;

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true, slug };
  } catch (err: unknown) {
    console.error('createSelfServeCompanyAction error:', err);
    return { success: false, error: getErrMsg(err, 'تعذر إنشاء مساحة الشركة.') };
  }
}

export async function claimCardByCodeInDashboardAction(
  rawCode: string,
  companyBatchName?: string
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
      return { success: false, error: 'هذا الكارت مرتبط بحساب مستخدم آخر بالفعل.' };
    }

    const updateCardPayload: Record<string, unknown> = {
      owner_id: user.id,
      status: 'active',
    };
    if (companyBatchName) {
      updateCardPayload.batch_name = companyBatchName;
    }

    const { error: upErr } = await supabaseAdmin
      .from('cards')
      .update(updateCardPayload)
      .eq('id', card.id);

    if (upErr) throw upErr;

    if (card.product === 'business' && !existingBc) {
      const slug = `card-${code.toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`;
      await supabaseAdmin.from('business_cards').insert({
        card_id: card.id,
        slug,
        full_name: user.user_metadata?.full_name || 'كارت أعمال جديد',
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

export async function createCompanyEmployeeCardAction(
  companyId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; code?: string }> {
  const user = await getAuthenticatedUser();
  if (!user || !user.email) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً.' };
  }

  try {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!company) {
      return { success: false, error: 'الشركة غير موجودة.' };
    }

    const isOwnerOrAdmin =
      isSuperAdminEmail(user.email) ||
      company.contact_email?.toLowerCase() === user.email.toLowerCase();

    if (!isOwnerOrAdmin) {
      return { success: false, error: 'غير مصرح لك بإضافة كروت لهذه الشركة.' };
    }

    let batchName = company.batch_name;
    if (!batchName) {
      batchName = `ORG-${company.slug.toUpperCase().slice(0, 12)}`;
      await supabaseAdmin.from('companies').update({ batch_name: batchName }).eq('id', company.id);
    }

    const { data: existingCodesData } = await supabaseAdmin.from('cards').select('code');
    const existingCodes = new Set(
      ((existingCodesData || []) as Array<{ code: string }>).map((c) => c.code)
    );
    const code = generateUnambiguousCode(existingCodes);

    const { data: newCard, error: cardErr } = await supabaseAdmin
      .from('cards')
      .insert({
        code,
        owner_id: user.id,
        product: 'business',
        status: 'active',
        batch_name: batchName,
      })
      .select('*')
      .single();

    if (cardErr || !newCard) throw cardErr;

    const fullName = (formData.get('full_name')?.toString() || '').trim() || 'موظف جديد';
    const jobTitle = (formData.get('job_title')?.toString() || '').trim() || null;
    const phone = (formData.get('phone')?.toString() || '').trim() || null;
    const whatsapp = (formData.get('whatsapp')?.toString() || '').trim() || phone || null;
    const email = (formData.get('email')?.toString() || '').trim() || null;
    const linkedin = normalizeOptionalUrl(formData.get('linkedin')?.toString());

    const slug = `emp-${code.toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { error: bcErr } = await supabaseAdmin.from('business_cards').insert({
      card_id: newCard.id,
      slug,
      full_name: fullName,
      job_title: jobTitle,
      company: company.name,
      phone,
      whatsapp,
      email,
      theme_color: '#181818',
      social_links: {
        linkedin,
        surface_theme: 'obsidian',
      },
      is_active: true,
    });

    if (bcErr) throw bcErr;

    revalidatePath('/dashboard');
    revalidatePath(`/org/${company.slug}`);
    revalidatePath('/admin');
    return { success: true, code };
  } catch (err: unknown) {
    console.error('createCompanyEmployeeCardAction error:', err);
    return { success: false, error: getErrMsg(err, 'تعذر إنشاء كارت الموظف.') };
  }
}
