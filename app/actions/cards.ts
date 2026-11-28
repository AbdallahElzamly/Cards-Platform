'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseEnv } from '@/lib/env';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import { CardSocialLinks, CardSurfaceTheme, parseSocialLinks } from '@/types/smart-cards';

async function getSiteOrigin(): Promise<string> {
  const hdrs = await headers();
  const forwardedHost = hdrs.get('x-forwarded-host') || hdrs.get('host');
  const forwardedProto = hdrs.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    const cleanHost = forwardedHost.split(',')[0].trim();
    const proto = cleanHost.includes('localhost') || cleanHost.startsWith('127.') ? 'http' : forwardedProto.split(',')[0].trim();
    return `${proto}://${cleanHost}`;
  }
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

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
): Promise<{
  success: boolean;
  error?: string;
  slug?: string;
  requiresEmailConfirmation?: boolean;
  message?: string;
}> {
  try {
    const env = getServerSupabaseEnv();
    if (!env.isAdminConfigured || !env.isAuthConfigured) {
      return {
        success: false,
        error: `إعدادات النظام غير مكتملة (${env.missingVars.join(', ')}). يرجى إضافتها في إعدادات السيرفر (Environment Variables).`,
      };
    }

    const rawCode = formData.get('code')?.toString() || '';
    const code = rawCode.trim().toUpperCase();
    const productType = formData.get('product_type')?.toString() === 'review' ? 'review' : 'business';
    const targetUrl = normalizeUrl(formData.get('target_url')?.toString()) || null;

    if (!code) {
      return { success: false, error: 'كود الكارت غير صالح.' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const supabase = await createSupabaseServerClient();

    // 1. Check current authenticated user OR perform verified signup/signin
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
        const siteOrigin = await getSiteOrigin();
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: accountEmail,
          password: accountPassword,
          options: {
            emailRedirectTo: `${siteOrigin}/auth/callback?next=${encodeURIComponent('/activate/' + code)}`,
            data: {
              full_name: displayName || 'صاحب الكارت',
              account_kind: 'individual',
            },
          },
        });

        if (signUpErr) {
          const msg = signUpErr.message.toLowerCase();
          if (msg.includes('already') || msg.includes('registered')) {
            return {
              success: false,
              error: 'هذا البريد مسجل مسبقاً. اختر «لدي حساب» وسجّل الدخول بكلمة مرورك.',
            };
          }
          return {
            success: false,
            error: `تعذر إنشاء الحساب: ${signUpErr.message}`,
          };
        }

        if (
          signUpData.user &&
          Array.isArray(signUpData.user.identities) &&
          signUpData.user.identities.length === 0
        ) {
          return {
            success: false,
            error: 'هذا البريد مسجل مسبقاً. اختر «لدي حساب» وسجّل الدخول بكلمة مرورك.',
          };
        }

        // Enforce email verification before binding hardware card ownership
        if (signUpData.user && !signUpData.session) {
          return {
            success: false,
            requiresEmailConfirmation: true,
            message:
              'بعتنالك رابط تأكيد على بريدك الإلكتروني — افتح الإيميل واضغط على الرابط، وهيرجعك تلقائياً لصفحة تفعيل الكارت بحسابك.',
          };
        }

        user = signUpData.user;
      } else {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: accountEmail,
          password: accountPassword,
        });

        if (signInErr || !signInData.user) {
          const msg = signInErr?.message?.toLowerCase() || '';
          return {
            success: false,
            error: msg.includes('email not confirmed')
              ? 'حسابك محتاج تأكيد الإيميل الأول — افتح بريدك الإلكتروني واضغط على رابط التفعيل وبعدها فعّل الكارت.'
              : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
          };
        }

        user = signInData.user;
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'تعذر التحقق من الحساب. يرجى المحاولة مرة أخرى.',
      };
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

    if (card.status === 'suspended' || card.status === 'lost') {
      return {
        success: false,
        error: 'هذا الكارت موقوف أو مبلغ عن فقدانه ولا يمكن إعادة تفعيله إلا عبر مالكه أو الإدارة.',
      };
    }

    const isCorporateBatch = Boolean(
      card.batch_name &&
        (card.batch_name.startsWith('CORP-') || card.batch_name.startsWith('ORG-'))
    );

    if (isCorporateBatch && !isSuperAdminEmail(user.email)) {
      const { data: authorizedCo } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('batch_name', card.batch_name)
        .ilike('contact_email', user.email || '')
        .maybeSingle();

      if (!authorizedCo) {
        return {
          success: false,
          error: 'هذا الكارت مخصص لأسطول شركة ويتم تفعيله من خلال مسؤول الشركة.',
        };
      }
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
