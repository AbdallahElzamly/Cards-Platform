'use client';

import React, { useState, useTransition } from 'react';
import { MerchantDashboardData, updateLoyaltyProgramSettings, rotateDailyPinAction } from '@/app/actions/loyalty-merchant';

interface MerchantLoyaltyDashboardProps {
  initialData: MerchantDashboardData;
}

export default function MerchantLoyaltyDashboard({ initialData }: MerchantLoyaltyDashboardProps) {
  const [data, setData] = useState<MerchantDashboardData>(initialData);
  const [currentPin, setCurrentPin] = useState<string>(data.program?.daily_pin_display || '1234');
  const [copiedLink, setCopiedLink] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const program = data.program;
  const metrics = data.metrics;

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/l/${program?.slug}` : `/l/${program?.slug}`;

  // Handle PIN Rotation
  const handleRotatePin = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await rotateDailyPinAction();
      if (!res.success || !res.newPin) {
        setErrorMsg(res.error || 'فشل تغيير كود الكاشير');
      } else {
        setCurrentPin(res.newPin);
        setSuccessMsg('تم تغيير كود الكاشير بنجاح! 🔄');
      }
    });
  };

  // Copy NFC link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Handle settings update
  const handleUpdateSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateLoyaltyProgramSettings(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل حفظ الإعدادات');
      } else {
        setSuccessMsg('تم حفظ الإعدادات وتحديثها بنجاح ✅');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">{program?.business_name || 'لوحة تحكم الولاء'}</h1>
            <p className="text-xs text-slate-500">إدارة برنامج الولاء، أختام العملاء، وكود الكاشير اليومي.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/l/${program?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 transition flex items-center gap-1.5"
            >
              <span>معاينة صفحة العميل ↗</span>
            </a>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Hero Section: Cashier PIN & NFC Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Cashier PIN Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                  الأمان والتحقق
                </span>
                <span className="text-[11px] text-slate-400">يتغير يومياً أو حسب الحاجة</span>
              </div>
              <h2 className="text-base font-bold mb-4">كود الكاشير اليومي (للأختام والهدية)</h2>
            </div>

            <div className="my-4 text-center">
              <div className="font-mono text-5xl font-black tracking-widest text-amber-300 bg-black/30 py-4 px-6 rounded-2xl inline-block border border-amber-400/20 shadow-inner">
                {currentPin}
              </div>
            </div>

            <button
              onClick={handleRotatePin}
              disabled={isPending}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-2xl transition shadow-md text-sm flex items-center justify-center gap-2"
            >
              <span>{isPending ? 'جاري التغيير...' : 'تغيير كود الكاشير الآن 🔄'}</span>
            </button>
          </div>

          {/* NFC Card Link Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  رابط NFC / QR
                </span>
                <span className="text-[11px] text-slate-400">اطبعه على طاولات المطعم</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-2">رابط كارت الولاء المباشر</h2>
              <p className="text-xs text-slate-500 mb-4 font-mono break-all bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {publicUrl}
              </p>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{copiedLink ? 'تم النسخ بنجاح! ✓' : 'نسخ رابط الكارت للبرمجة على NFC 📋'}</span>
            </button>
          </div>

        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <span className="text-xs text-slate-500 font-medium mb-1">إجمالي المشتركين</span>
            <span className="text-3xl font-black text-slate-900">{metrics.totalMembers}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <span className="text-xs text-slate-500 font-medium mb-1">أختام آخر 30 يوم</span>
            <span className="text-3xl font-black text-blue-600">{metrics.visitsLast30Days}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <span className="text-xs text-slate-500 font-medium mb-1">قسائم جاهزة (نشطة)</span>
            <span className="text-3xl font-black text-amber-600">{metrics.activeVouchers}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <span className="text-xs text-slate-500 font-medium mb-1">وجبات تم صرفها</span>
            <span className="text-3xl font-black text-emerald-600">{metrics.redeemedVouchers}</span>
          </div>
        </div>

        {/* Program Settings Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">إعدادات برنامج الولاء</h2>

          <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المتجر / المطعم</label>
              <input
                type="text"
                name="business_name"
                defaultValue={program?.business_name || ''}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان المكافأة (السادسة)</label>
              <input
                type="text"
                name="reward_title"
                defaultValue={program?.reward_title || ''}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">شروط وأحكام المكافأة</label>
              <input
                type="text"
                name="reward_terms"
                defaultValue={program?.reward_terms || ''}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد زيارات الهدية (الزيارات المطلوبة)</label>
              <select
                name="stamps_required"
                defaultValue={program?.stamps_required || 6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} زيارات (السادسة/الأخيرة مجاناً)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الحد الأدنى للفاتورة (ج.م)</label>
              <input
                type="number"
                name="min_bill_egp"
                min={0}
                defaultValue={program?.min_bill_egp || 100}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">فترة التهدئة بين الزيارات (بالساعات)</label>
              <input
                type="number"
                name="cooldown_hours"
                min={1}
                max={72}
                defaultValue={program?.cooldown_hours || 18}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">حالة البرنامج</label>
              <select
                name="is_active"
                defaultValue={program?.is_active ? 'true' : 'false'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="true">نشط (يقبل الأختام)</option>
                <option value="false">متوقف مؤقتاً</option>
              </select>
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition text-sm"
              >
                {isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">سجل الزيارات والنشاط الأخير</h2>

          {data.recentVisits.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">لا توجد زيارات مسجلة حتى الآن.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 pr-2">اسم العميل</th>
                    <th className="pb-3 px-2">رقم الموبايل</th>
                    <th className="pb-3 px-2">رقم الختم</th>
                    <th className="pb-3 px-2">رقم الطاولة</th>
                    <th className="pb-3 pl-2 text-left">الوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.recentVisits.map((v) => (
                    <tr key={v.id} className="text-slate-700 hover:bg-slate-50/50 transition">
                      <td className="py-3 pr-2 font-bold text-slate-900">{v.member_name}</td>
                      <td className="py-3 px-2 font-mono text-slate-500">••••{v.phone_last4}</td>
                      <td className="py-3 px-2">
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                          ختم {v.stamp_number_after}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono">{v.table_code ? `#${v.table_code}` : '-'}</td>
                      <td className="py-3 pl-2 text-left text-slate-400 font-mono">
                        {new Date(v.created_at).toLocaleString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
