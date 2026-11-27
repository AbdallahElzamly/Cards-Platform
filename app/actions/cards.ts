'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseEnv } from '@/lib/env';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import { CardSocialLinks, CardSurfaceTheme, parseSocialLinks } from '@/types/smart-cards';

function normalizeUrl(raw: string | null | undefined): string | undefined {
  const trimmed = (raw || '').trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function buildCleanSlug(name: string, fallbackCode: string): string {
  const ascii = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = Math.floor(100 + Math.random() * 900);
  if (ascii.length >= 2) {
    return `${ascii}-${suffix}`;
  }
  return `card-${fallbackCode.toLowerCase()}-${suffix}`;
}

export async function activateCardAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; slug?: string }> {
  try {
    const env = getServerSupabaseEnv();
    if (!env.isAdminConfigured || !env.isAuthConfigured) {
      return {
        success: false,
        error: `إعدادات النظام غير مكتملة (${env.missingVars.join(', ')}). يرجى إضافتها في Vercel.`,
      };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const supabase = await createSupabaseServerClient();

    // 1. Check current authenticated user OR perform inline 1-step signup/signin
    let {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const accountEmail = (formData.get('account_email')?.toString() || '').trim().toLowerCase();
      const accountPassword = formData.get('account_password')?.toString() || '';
      const authMode = formData.get('auth_mode')?.toString() === 'signin' ? 'signin' : 'signup';
      const displayName = (formData.get('full_name')?.toString() || '').trim();

      if (!accountEmail || !accountPassword) {
        return {
          success: false,
          error: 'أدخل بريدك الإلكتروني وكلمة مرور (6 خانات على الأقل) لحفظ ملكية الكارت في حسابك.',
        };
      }

      if (accountPassword.length < 6) {
        return {
          success: false,
          error: 'كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل.',
        };
      }

      if (authMode === 'signup') {
        const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: accountEmail,
          password: accountPassword,
          email_confirm: true,
          user_metadata: {
            full_name: displayName || 'صاحب الكارت',
            account_kind: 'individual',
          },
        });

        // If user already exists, gracefully try signing in with the provided password
        if (createErr && !createErr.message.toLowerCase().includes('already')) {
          return {
            success: false,
            error: `تعذر إنشاء الحساب: ${createErr.message}`,
          };
        }
      }

      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: accountEmail,
        password: accountPassword,
      });

      if (signInErr || !signInData.user) {
        return {
          success: false,
          error:
            authMode === 'signup'
              ? 'هذا البريد مسجل مسبقاً بكلمة مرور مختلفة. اختر «لدي حساب بالفعل» وأدخل كلمة مرورك الصحيحة.'
              : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        };
      }

      user = signInData.user;
    }

    const rawCode = formData.get('code')?.toString() || '';
    const code = rawCode.trim().toUpperCase();
    const productType = formData.get('product_type')?.toString() === 'review' ? 'review' : 'business';
    const targetUrl = normalizeUrl(formData.get('target_url')?.toString()) || null;

    if (!code) {
      return { success: false, error: 'كود الكارت غير صالح.' };
    }

    // 2. Fetch card + any pre-provisioned business_card
    const { data: card, error: cardErr } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('code', code)
      .single();

    if (cardErr || !card) {
      return { success: false, error: 'هذا الكارت غير مسجل في النظام.' };
    }

    const { data: existingBc } = await supabaseAdmin
      .from('business_cards')
      .select('*')
      .eq('card_id', card.id)
      .maybeSingle();

    const existingSocials = parseSocialLinks(existingBc?.social_links);
    const isAdminProvisioned = Boolean(existingSocials.admin_provisioned);

    // Block takeover ONLY if card already belongs to another real end-user (not unclaimed / not admin-provisioned)
    if (
      card.status === 'active' &&
      card.owner_id &&
      card.owner_id !== user.id &&
      !isAdminProvisioned &&
      !isSuperAdminEmail(user.email)
    ) {
      return {
        success: false,
        error: 'هذا الكارت مفعل ومرتبط بحساب عميل آخر بالفعل. سجل الدخول بحساب مالك الكارت لتعديله.',
      };
    }

    // 3. Bind card ownership and active status
    const { error: updateErr } = await supabaseAdmin
      .from('cards')
      .update({
        owner_id: user.id,
        status: 'active',
        product: productType,
        target_url: productType === 'review' ? targetUrl : card.target_url,
      })
      .eq('id', card.id);

    if (updateErr) {
      return {
        success: false,
        error: `فشل ربط الكارت بالحساب: ${updateErr.message}`,
      };
    }

    // 4. Upsert rich business_cards profile when product === 'business'
    let slug = existingBc?.slug || '';
    if (productType === 'business') {
      const fullName =
        formData.get('full_name')?.toString()?.trim() ||
        existingBc?.full_name ||
        'صاحب الكارت';
      const jobTitle = formData.get('job_title')?.toString()?.trim() ?? existingBc?.job_title ?? null;
      const company = formData.get('company')?.toString()?.trim() ?? existingBc?.company ?? null;
      const bio = formData.get('bio')?.toString()?.trim() ?? existingBc?.bio ?? null;
      const phone = formData.get('phone')?.toString()?.trim() ?? existingBc?.phone ?? null;
      const phone2 = formData.get('phone2')?.toString()?.trim() ?? existingSocials.phone2 ?? '';
      const whatsapp =
        formData.get('whatsapp')?.toString()?.trim() ||
        existingBc?.whatsapp ||
        phone ||
        null;
      const email = formData.get('email')?.toString()?.trim() ?? existingBc?.email ?? null;
      const website = normalizeUrl(formData.get('website')?.toString()) ?? existingBc?.website ?? null;
      const avatarUrl = formData.get('avatar_url')?.toString()?.trim() || existingBc?.avatar_url || null;

      const updatedSocials: CardSocialLinks = {
        ...existingSocials,
        phone2: phone2 || undefined,
        linkedin: normalizeUrl(formData.get('linkedin')?.toString()) ?? existingSocials.linkedin,
        facebook: normalizeUrl(formData.get('facebook')?.toString()) ?? existingSocials.facebook,
        instagram: normalizeUrl(formData.get('instagram')?.toString()) ?? existingSocials.instagram,
        tiktok: normalizeUrl(formData.get('tiktok')?.toString()) ?? existingSocials.tiktok,
        telegram: normalizeUrl(formData.get('telegram')?.toString()) ?? existingSocials.telegram,
        surface_theme:
          (formData.get('surface_theme')?.toString() as CardSurfaceTheme | undefined) ||
          existingSocials.surface_theme ||
          'obsidian',
        admin_provisioned: false, // Now claimed by actual owner
      };

      if (existingBc?.id) {
        slug = existingBc.slug;
        const { error: bcUpdateErr } = await supabaseAdmin
          .from('business_cards')
          .update({
            full_name: fullName,
            job_title: jobTitle || null,
            company: company || null,
            bio: bio || null,
            phone: phone || null,
            whatsapp: whatsapp || null,
            email: email || null,
            website: website || null,
            avatar_url: avatarUrl,
            social_links: updatedSocials,
            is_active: true,
          })
          .eq('id', existingBc.id);

        if (bcUpdateErr) {
          return {
            success: false,
            error: `فشل تحديث بيانات البطاقة: ${bcUpdateErr.message}`,
          };
        }
      } else {
        slug = buildCleanSlug(fullName, code);
        const { error: bcInsertErr } = await supabaseAdmin.from('business_cards').insert({
          card_id: card.id,
          slug,
          full_name: fullName,
          job_title: jobTitle || null,
          company: company || null,
          bio: bio || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          email: email || null,
          website: website || null,
          avatar_url: avatarUrl,
          theme_color: '#181818',
          social_links: updatedSocials,
          is_active: true,
        });

        if (bcInsertErr) {
          return {
            success: false,
            error: `فشل إنشاء صفحة الكارت: ${bcInsertErr.message}`,
          };
        }
      }
    }

    revalidatePath('/dashboard');
    revalidatePath(`/activate/${code}`);
    if (slug) revalidatePath(`/c/${slug}`);

    return { success: true, slug };
  } catch (err: unknown) {
    console.error('activateCardAction error:', err);
    const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تفعيل الكارت';
    return { success: false, error: message };
  }
}
