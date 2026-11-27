'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AccountKind,
  merchantSignInAction,
  merchantSignUpAction,
} from '@/app/actions/auth';

interface MerchantLoginFormProps {
  redirectTo: string;
  isServerConfigured: boolean;
  missingVars: string[];
  callbackError?: boolean;
  initialMode?: 'signin' | 'signup';
  initialKind?: AccountKind;
}

export default function MerchantLoginForm({
  redirectTo,
  isServerConfigured,
  missingVars,
  callbackError,
  initialMode = 'signin',
  initialKind = 'individual',
}: MerchantLoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [accountKind, setAccountKind] = useState<AccountKind>(initialKind);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(
    callbackError ? 'تعذر التحقق من الرابط، يرجى تسجيل الدخول ببريدك وكلمة المرور.' : null
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
          ? await merchantSignUpAction(email, password, displayName, accountKind)
          : await merchantSignInAction(email, password);

      if (!res.success) {
        setErrorMsg(res.error || 'تعذر تسجيل الدخول، يرجى المحاولة مرة أخرى.');
        return;
      }

      setSuccessMsg(res.message || 'تم تسجيل الدخول بنجاح.');

      if (res.requiresEmailConfirmation) {
        setMode('signin');
        return;
      }

      const target =
        mode === 'signup' && accountKind === 'merchant' && redirectTo === '/dashboard'
          ? '/dashboard/loyalty'
          : redirectTo;

      router.replace(target);
      router.refresh();
    });
  };

  const nameLabel =
    accountKind === 'company'
      ? 'اسم الشركة أو المؤسسة'
      : accountKind === 'merchant'
      ? 'اسم المطعم أو الكافيه'
      : 'الاسم الكامل';

  const namePlaceholder =
    accountKind === 'company'
      ? 'مثال: شركة الأفق للهندسة والمقاولات'
      : accountKind === 'merchant'
      ? 'مثال: دوز كافيه'
      : 'مثال: م. أحمد وسيم';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 sm:p-6 font-sans" dir="rtl">
      <div className="w-full max-w-[440px] bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-[#181818] text-white font-bold text-sm flex items-center justify-center transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
              K
            </span>
            <span className="text-base font-bold text-neutral-900 tracking-tight">KUWI</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            الرئيسية ←
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-950 mb-1.5" style={{ textWrap: 'balance' }}>
            {mode === 'signup' ? 'إنشاء حساب جديد على كوي' : 'تسجيل الدخول إلى لوحتك'}
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed" style={{ textWrap: 'pretty' }}>
            {mode === 'signup'
              ? 'اختر نوع حسابك لإدارة كرتك الشخصي أو أسطول شركتك أو برنامج الولاء فوراً بدون تعقيد'
              : 'تحكم في بطاقاتك الذكية، فريق شركتك، والعملاء المهتمين من مكان واحد'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Nested Radius: outer rounded-2xl 16px, p-1 4px -> inner rounded-xl 12px) */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-2xl border border-neutral-200/70 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`min-h-[44px] py-2 text-sm font-semibold rounded-xl transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200/80'
                : 'text-neutral-500 hover:text-neutral-900'
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
            className={`min-h-[44px] py-2 text-sm font-semibold rounded-xl transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200/80'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            حساب جديد
          </button>
        </div>

        {/* Account Kind Selector on Sign Up */}
        {mode === 'signup' && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              نوع الاستخدام
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'individual', title: 'فردي', sub: 'كارت أعمال' },
                { id: 'company', title: 'شركة', sub: 'إدارة أسطول' },
                { id: 'merchant', title: 'مطعم', sub: 'نظام ولاء' },
              ].map((item) => {
                const active = accountKind === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAccountKind(item.id as AccountKind)}
                    className={`p-3 rounded-2xl border text-right transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer ${
                      active
                        ? 'bg-[#181818] text-white border-[#181818]'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="text-xs font-semibold">{item.title}</div>
                    <div className={`text-xs mt-0.5 ${active ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {item.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing Env Diagnostic Warning */}
        {!isServerConfigured && (
          <div className="p-4 mb-5 bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl text-xs leading-relaxed">
            <div className="font-semibold mb-1">تنبيه إعدادات البيئة على السيرفر</div>
            <p>
              متغيرات الاتصال التالية غير مضبوطة:{' '}
              <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded" dir="ltr">
                {missingVars.join(', ')}
              </code>
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 mb-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-medium text-center leading-relaxed animate-loyalty-shake">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-medium text-center leading-relaxed">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                {nameLabel}
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={namePlaceholder}
                className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15 focus:border-neutral-900 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-950 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900/15 focus:border-neutral-900 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
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
              placeholder="6 خانات على الأقل"
              className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-950 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900/15 focus:border-neutral-900 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] text-left"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[48px] py-3 px-4 bg-[#181818] hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60 text-white font-semibold rounded-xl transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] text-sm mt-1 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
          >
            {isPending ? (
              <span>جاري التحقق من الحساب...</span>
            ) : mode === 'signup' ? (
              <span>إنشاء الحساب والدخول فوراً</span>
            ) : (
              <span>الدخول إلى لوحة التحكم</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
