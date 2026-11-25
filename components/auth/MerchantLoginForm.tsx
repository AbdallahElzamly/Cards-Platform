'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { merchantSignInAction, merchantSignUpAction } from '@/app/actions/auth';

interface MerchantLoginFormProps {
  redirectTo: string;
  isServerConfigured: boolean;
  missingVars: string[];
  callbackError?: boolean;
}

export default function MerchantLoginForm({
  redirectTo,
  isServerConfigured,
  missingVars,
  callbackError,
}: MerchantLoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(
    callbackError ? 'تعذر التحقق من رابط التفعيل، يرجى تسجيل الدخول ببريدك وكلمة المرور.' : null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res =
        mode === 'signup'
          ? await merchantSignUpAction(email, password, businessName)
          : await merchantSignInAction(email, password);

      if (!res.success) {
        setErrorMsg(res.error || 'تعذر تسجيل الدخول، يرجى المحاولة مرة أخرى.');
        return;
      }

      setSuccessMsg(res.message || 'تم تسجيل الدخول بنجاح!');

      if (res.requiresEmailConfirmation) {
        setMode('signin');
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-slate-200/80 p-7 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-2xl shadow-md shadow-blue-600/20">
            💼
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">
            {mode === 'signup' ? 'إنشاء حساب مطعم جديد' : 'تسجيل دخول التاجر'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {mode === 'signup'
              ? 'أنشئ حسابك في ثوانٍ لتفعيل كارت الولاء وكود الكاشير اليومي لمطعمك'
              : 'سجل دخولك لإدارة برنامج الولاء وكود الكاشير اليومي ومتابعة الزيارات'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            حساب تاجر جديد
          </button>
        </div>

        {/* Missing Env Diagnostic Warning */}
        {!isServerConfigured && (
          <div className="p-4 mb-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs leading-relaxed">
            <div className="font-extrabold mb-1">⚠️ تنبيه إعدادات البيئة على Vercel:</div>
            <p>
              متغيرات الاتصال التالية غير مضبوطة بعد على السيرفر:{' '}
              <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded" dir="ltr">
                {missingVars.join(', ')}
              </code>
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold text-center leading-relaxed animate-loyalty-shake">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center leading-relaxed">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم المطعم أو الكافيه
              </label>
              <input
                type="text"
                maxLength={60}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="مثال: دوز كافيه - فرع المعادي"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@restaurant.com"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              minLength={6}
              dir="ltr"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition text-left"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[50px] py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold rounded-2xl shadow-md shadow-blue-600/20 transition text-sm mt-1 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري التحقق من الحساب...</span>
              </>
            ) : mode === 'signup' ? (
              'إنشاء حساب المطعم والبدء فوراً 🚀'
            ) : (
              'تسجيل الدخول للوحة التحكم'
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-700 transition">
            → العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
