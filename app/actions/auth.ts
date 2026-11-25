'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSupabaseEnv } from '@/lib/env';

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
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من البيانات أو أنشئ حساب تاجر جديد.';
  }
  if (lower.includes('email not confirmed')) {
    return 'يرجى تفعيل حسابك من الرابط المرسل لبريدك الإلكتروني أولاً، أو إيقاف Confirm Email من إعدادات Supabase Auth.';
  }
  if (lower.includes('user already registered')) {
    return 'هذا البريد مسجل بالفعل، يمكنك تسجيل الدخول مباشرة.';
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: mapSupabaseAuthError(error),
      };
    }

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح! جارٍ فتح لوحة التحكم...',
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
  businessName?: string
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

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          business_name: businessName?.trim().slice(0, 60) || 'مطعمي',
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
        message:
          'تم إنشاء الحساب بنجاح! تفقد بريدك الإلكتروني لتأكيد الحساب ثم قم بتسجيل الدخول.',
      };
    }

    return {
      success: true,
      message: 'تم إنشاء الحساب وتسجيل الدخول بنجاح! جارٍ تجهيز لوحة مطعمك...',
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
