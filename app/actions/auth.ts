'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSupabaseEnv } from '@/lib/env';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
  message?: string;
}

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

function mapSupabaseAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  const lower = raw.toLowerCase();

  if (raw.startsWith('MISSING_SUPABASE_AUTH_ENV:')) {
    const vars = raw.split(':')[1] || '';
    return `متغيرات الاتصال بقاعدة البيانات غير مضبوطة على السيرفر (${vars}). يرجى إضافتها في إعدادات السيرفر (Environment Variables) ثم إعادة النشر.`;
  }
  if (lower.includes('invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من البيانات أو أنشئ حساباً جديداً.';
  }
  if (lower.includes('email not confirmed')) {
    return 'حسابك محتاج تأكيد الإيميل الأول — افتح بريدك الإلكتروني واضغط على رابط التفعيل وبعدها سجل الدخول.';
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
        error: `إعدادات Supabase غير مكتملة على السيرفر (${env.missingVars.join(', ')}). أضفها في إعدادات السيرفر (Environment Variables) ثم أعد النشر.`,
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      const msg = error?.message?.toLowerCase() || '';
      return {
        success: false,
        requiresEmailConfirmation: msg.includes('email not confirmed'),
        error: mapSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح.',
    };
  } catch (err) {
    console.error('merchantSignInAction error:', err);
    return {
      success: false,
      error: mapSupabaseAuthError(err),
    };
  }
}

/**
 * Public signups ALWAYS create isolated Individual accounts (`account_kind: 'individual'`)
 * and enforce Supabase email verification (`emailRedirectTo`).
 * Company fleets and Restaurant loyalty programs are provisioned exclusively by Super Admin.
 */
export async function merchantSignUpAction(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthActionResult> {
  try {
    const env = getServerSupabaseEnv();
    if (!env.isAuthConfigured) {
      return {
        success: false,
        error: `إعدادات Supabase غير مكتملة على السيرفر (${env.missingVars.join(', ')}). أضفها في إعدادات السيرفر (Environment Variables) ثم أعد النشر.`,
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
    const siteOrigin = await getSiteOrigin();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: `${siteOrigin}/auth/callback?next=/dashboard`,
        data: {
          full_name: trimmedName || undefined,
          account_kind: 'individual',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: mapSupabaseAuthError(error),
      };
    }

    // Supabase returns an empty identities array when email already exists with obfuscation enabled
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        error: 'هذا البريد مسجل بالفعل، انتقل لتبويب «تسجيل الدخول» أو راجع بريدك الإلكتروني.',
      };
    }

    if (data.user && !data.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: 'بعتنالك رابط تأكيد على بريدك الإلكتروني — افتح الإيميل واضغط على الرابط عشان تفعّل حسابك وتدخل على لوحتك.',
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

export async function resendConfirmationEmailAction(email: string): Promise<AuthActionResult> {
  try {
    const env = getServerSupabaseEnv();
    if (!env.isAuthConfigured) {
      return {
        success: false,
        error: `إعدادات Supabase غير مكتملة على السيرفر (${env.missingVars.join(', ')}).`,
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'أدخل بريدك الإلكتروني أولاً لإعادة إرسال رابط التفعيل.' };
    }

    const siteOrigin = await getSiteOrigin();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: `${siteOrigin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      return {
        success: false,
        error: mapSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      requiresEmailConfirmation: true,
      message: 'تم إرسال رابط تأكيد جديد لبريدك الإلكتروني — تفقد الوارد أو مجلد الرسائل غير المرغوب فيها (Spam).',
    };
  } catch (err) {
    console.error('resendConfirmationEmailAction error:', err);
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
