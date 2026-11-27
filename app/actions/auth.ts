'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseEnv } from '@/lib/env';

export type AccountKind = 'individual' | 'company' | 'merchant';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
  message?: string;
}

function mapSupabaseAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  const lower = raw.toLowerCase();

  if (raw.startsWith('MISSING_SUPABASE_AUTH_ENV:')) {
    const vars = raw.split(':')[1] || '';
    return `متغيرات الاتصال بقاعدة البيانات غير مضبوطة على السيرفر (${vars}). يرجى إضافتها في Vercel ثم عمل Redeploy.`;
  }
  if (lower.includes('invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من البيانات أو أنشئ حساباً جديداً.';
  }
  if (lower.includes('email not confirmed')) {
    return 'يرجى تفعيل حسابك من الرابط المرسل لبريدك الإلكتروني، أو حاول تسجيل الدخول مرة أخرى.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'هذا البريد مسجل بالفعل، انتقل لتبويب «تسجيل الدخول» وادخل مباشرة.';
  }
  if (lower.includes('password should be at least')) {
    return 'كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'تم إرسال طلبات كثيرة في وقت قصير، يرجى الانتظار دقيقة والمحاولة مرة أخرى.';
  }
  if (lower.includes('database error')) {
    return 'حدث خطأ في صلاحيات قاعدة بيانات Supabase. يرجى تشغيل ملف supabase/FIX_SUPABASE_PERMISSIONS.sql داخل Supabase SQL Editor.';
  }
  if (lower.includes('fetch failed') || lower.includes('failed to fetch') || lower.includes('enotfound')) {
    return 'تعذر الاتصال بخادم Supabase. تأكد من صحة رابط NEXT_PUBLIC_SUPABASE_URL وأن المشروع غير متوقف.';
  }

  return 'حدث خطأ أثناء المصادقة. يرجى التحقق من البيانات والمحاولة مرة أخرى.';
}

export async function merchantSignInAction(
  email: string,
  password: string
): Promise<AuthActionResult> {
  try {
    const env = getServerSupabaseEnv();
    if (!env.isAuthConfigured) {
      return {
        success: false,
        error: `إعدادات Supabase غير مكتملة على السيرفر (${env.missingVars.join(', ')}). أضفها في Vercel Environment Variables ثم أعد النشر.`,
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
    }

    const supabase = await createSupabaseServerClient();
    let { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    // Auto-heal unconfirmed accounts when service_role is available
    if (error && error.message.toLowerCase().includes('email not confirmed') && env.isAdminConfigured) {
      try {
        const admin = getSupabaseAdmin();
        const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 1000 });
        const targetUser = usersList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
        if (targetUser) {
          await admin.auth.admin.updateUserById(targetUser.id, { email_confirm: true });
          const retry = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          data = retry.data;
          error = retry.error;
        }
      } catch (healErr) {
        console.warn('Auto-confirm heal skipped:', healErr);
      }
    }

    if (error || !data.user) {
      return {
        success: false,
        error: mapSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح. جارٍ فتح لوحة التحكم...',
    };
  } catch (err) {
    console.error('merchantSignInAction error:', err);
    return {
      success: false,
      error: mapSupabaseAuthError(err),
    };
  }
}

export async function merchantSignUpAction(
  email: string,
  password: string,
  displayName?: string,
  accountKind: AccountKind = 'individual'
): Promise<AuthActionResult> {
  try {
    const env = getServerSupabaseEnv();
    if (!env.isAuthConfigured) {
      return {
        success: false,
        error: `إعدادات Supabase غير مكتملة على السيرفر (${env.missingVars.join(', ')}). أضفها في Vercel Environment Variables ثم أعد النشر.`,
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || password.length < 6) {
      return {
        success: false,
        error: 'يرجى إدخال بريد إلكتروني صحيح وكلمة مرور من 6 خانات على الأقل.',
      };
    }

    const trimmedName = displayName?.trim().slice(0, 80) || '';
    const supabase = await createSupabaseServerClient();

    // Fast path: create pre-confirmed user via Admin API (avoids SMTP limits & confirmation friction)
    if (env.isAdminConfigured) {
      const admin = getSupabaseAdmin();
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: trimmedName || undefined,
          business_name: trimmedName || 'نشاطي',
          account_kind: accountKind,
        },
      });

      if (createErr) {
        return {
          success: false,
          error: mapSupabaseAuthError(createErr),
        };
      }

      // If company account, ensure a starter company workspace exists if name was given
      if (accountKind === 'company' && trimmedName && created.user) {
        try {
          const { data: existingCo } = await admin
            .from('companies')
            .select('id')
            .eq('contact_email', cleanEmail)
            .maybeSingle();

          if (!existingCo) {
            const baseSlug =
              trimmedName
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '') || 'org';
            const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
            const batchName = `ORG-${slug.toUpperCase().slice(0, 12)}`;
            await admin.from('companies').insert({
              name: trimmedName,
              slug,
              contact_email: cleanEmail,
              batch_name: batchName,
            });
          }
        } catch (coErr) {
          console.warn('Starter company creation skipped:', coErr);
        }
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInErr) {
        return {
          success: false,
          error: mapSupabaseAuthError(signInErr),
        };
      }

      return {
        success: true,
        message: 'تم إنشاء حسابك وتسجيل الدخول فوراً.',
      };
    }

    // Fallback when only anon/publishable key is configured
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: trimmedName || undefined,
          business_name: trimmedName || 'نشاطي',
          account_kind: accountKind,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: mapSupabaseAuthError(error),
      };
    }

    if (data.user && !data.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: 'تم إنشاء الحساب بنجاح. تفقد بريدك الإلكتروني لتأكيد الحساب ثم سجل الدخول.',
      };
    }

    return {
      success: true,
      message: 'تم إنشاء الحساب وتسجيل الدخول بنجاح.',
    };
  } catch (err) {
    console.error('merchantSignUpAction error:', err);
    return {
      success: false,
      error: mapSupabaseAuthError(err),
    };
  }
}

export async function merchantSignOutAction(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('merchantSignOutAction error:', err);
  }
  redirect('/auth/login');
}
