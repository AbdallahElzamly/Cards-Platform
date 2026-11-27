'use client';

import React, { useState, useTransition } from 'react';
import {
  MerchantDashboardData,
  updateLoyaltyProgramSettings,
  rotateDailyPinAction,
} from '@/app/actions/loyalty-merchant';
import { merchantSignOutAction } from '@/app/actions/auth';
import { parseRewardTermsAndMenu } from '@/lib/loyalty-menu';

interface MerchantLoyaltyDashboardProps {
  initialData: MerchantDashboardData;
}

export default function MerchantLoyaltyDashboard({
  initialData,
}: MerchantLoyaltyDashboardProps) {
  const [program, setProgram] = useState(initialData.program);
  const [currentPin, setCurrentPin] = useState<string>(
    initialData.program.daily_pin_display || '1234'
  );
  const [pinRotatedAt, setPinRotatedAt] = useState<string>(
    initialData.program.pin_rotated_at
  );
  const [tableInput, setTableInput] = useState<string>('1');
  const [copiedType, setCopiedType] = useState<'direct' | 'gateway' | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const metrics = initialData.metrics;
  const isSuperAdmin = initialData.isSuperAdmin;
  const parsedReward = parseRewardTermsAndMenu(program.reward_terms);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const tableSuffix = tableInput.trim() ? `?t=${encodeURIComponent(tableInput.trim())}` : '';
  const directNfcUrl = `${origin}/l/${program.slug}${tableSuffix}`;
  const dynamicGatewayUrl = `${origin}/q/${program.slug}${tableSuffix}`;

  const spacedPin = currentPin.split('').join(' ');

  const handleRotatePin = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await rotateDailyPinAction(program.id);
      if (!res.success || !res.newPin) {
        setErrorMsg(res.error || 'تعذر تغيير كود الكاشير.');
      } else {
        setCurrentPin(res.newPin);
        if (res.rotatedAt) setPinRotatedAt(res.rotatedAt);
        setSuccessMsg('تم توليد كود كاشير جديد فوراً وإيقاف الكود القديم ✅');
      }
    });
  };

  const handleCopy = async (text: string, type: 'direct' | 'gateway') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      setErrorMsg('تعذر النسخ التلقائي، يمكنك نسخ الرابط يدوياً.');
    }
  };

  const handleUpdateSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.set('program_id', program.id);

    startTransition(async () => {
      const res = await updateLoyaltyProgramSettings(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل حفظ الإعدادات.');
      } else {
        if (res.updatedProgram) setProgram(res.updatedProgram);
        setSuccessMsg('تم تحديث إعدادات برنامج الولاء بنجاح ✅');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3.5 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Top Navigation Header */}
        <header className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-sm"
              style={{ backgroundColor: program.primary_color || '#1E3A8A' }}
            >
              🏪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {program.business_name}
                </h1>
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    program.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {program.is_active ? 'نشط الآن' : 'متوقف مؤقتاً'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                لوحة التاجر والكاشير • {initialData.merchantEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={`/l/${program.slug}?t=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial text-center px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-xl text-xs transition"
            >
              معاينة كارت العميل ↗
            </a>
            <form action={merchantSignOutAction}>
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                خروج
              </button>
            </form>
          </div>
        </header>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-extrabold text-center">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-extrabold text-center">
            {errorMsg}
          </div>
        )}

        {/* Hero Row: Cashier Daily PIN + NFC / Dynamic QR Link Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Today's Cashier PIN Hero Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-extrabold text-amber-300 bg-amber-400/15 border border-amber-400/20 px-3 py-1 rounded-full">
                  كود الكاشير اليومي 🔐
                </span>
                <span className="text-[11px] text-slate-400">
                  آخر تحديث:{' '}
                  {pinRotatedAt
                    ? new Date(pinRotatedAt).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'اليوم'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                أعطِ هذا الكود للعميل بعد دفع الفاتورة ليختم زيارته، أو أدخله بنفسك لصرف الوجبة السادسة المجانية.
              </p>
            </div>

            <div className="my-5 text-center">
              <div
                dir="ltr"
                className="font-mono text-5xl font-black tracking-[0.25em] text-amber-300 bg-black/40 py-5 px-8 rounded-2xl inline-block border border-amber-400/25 shadow-inner"
              >
                {spacedPin}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRotatePin}
              disabled={isPending}
              className="w-full min-h-[50px] py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-black rounded-2xl transition shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isPending ? 'جاري التغيير...' : 'تغيير الكود الآن 🔄'}</span>
            </button>
          </div>

          {/* Right Hero Card: Super Admin NFC/QR Programmer OR Merchant Managed Hardware & Menu Status */}
          {isSuperAdmin ? (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/70 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                    برمجة شرائح NFC ورموز QR (للمشرف فقط) 📲
                  </span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500">رقم الطاولة:</label>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={10}
                      value={tableInput}
                      onChange={(e) => setTableInput(e.target.value)}
                      placeholder="1"
                      className="w-14 px-2 py-1 text-center font-mono text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      الرابط المباشر السريع (NFC Tag):
                    </span>
                    <p dir="ltr" className="font-mono text-xs text-slate-800 break-all text-left">
                      {directNfcUrl}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      بوابة التحويل الديناميكي بدون كاش (Dynamic QR):
                    </span>
                    <p dir="ltr" className="font-mono text-xs text-slate-800 break-all text-left">
                      {dynamicGatewayUrl}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCopy(directNfcUrl, 'direct')}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl transition text-xs cursor-pointer"
                >
                  {copiedType === 'direct' ? 'تم النسخ ✓' : 'نسخ رابط NFC المباشر 📋'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(dynamicGatewayUrl, 'gateway')}
                  className="py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold rounded-2xl transition text-xs cursor-pointer"
                >
                  {copiedType === 'gateway' ? 'تم النسخ ✓' : 'نسخ رابط بوابة QR 🔗'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/70 flex flex-col justify-between gap-4">
              <div>
                <span className="inline-block text-xs font-extrabold text-[#7C3AED] bg-purple-50 border border-purple-200 px-3 py-1 rounded-full mb-3">
                  ستاندات الطاولات والمنيو الرقمي 🍽️
                </span>
                <h2 className="text-base font-black text-slate-900 mb-2">
                  كروت وستاندات الطاولات مبرمجة ومؤمّنة بالكامل من KUWI
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  لا تحتاج لأي برمجة تقنية؛ كل ستاند NFC أو QR على طاولات مطعمك مربوط مباشرة ببرنامج الولاء الخاص بك. يمكنك من الإعدادات بالأسفل إضافة <strong>رابط المنيو الرقمي</strong> ليتم تحويل العميل إليه تلقائياً بعد تسجيل زيارته.
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-500 block mb-1">حالة تحويل المنيو بعد الختم:</span>
                  {parsedReward.menuUrl ? (
                    <a
                      href={parsedReward.menuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="font-mono text-emerald-700 font-bold break-all underline"
                    >
                      ✓ {parsedReward.menuUrl}
                    </a>
                  ) : (
                    <span className="text-amber-700 font-bold">
                      لم تتم إضافة رابط المنيو بعد — أضفه في الإعدادات بالأسفل
                    </span>
                  )}
                </div>
              </div>

              <a
                href={`https://wa.me/201112708046?text=${encodeURIComponent(
                  `أهلاً فريق KUWI، نرغب في طلب ستاندات/كروت NFC إضافية لمطعم ${program.business_name}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[46px] py-3 px-4 bg-[#0B0B0F] hover:bg-neutral-800 text-[#C8FF2E] font-extrabold rounded-2xl transition text-xs flex items-center justify-center gap-2"
              >
                <span>طلب ستاندات طاولات إضافية من KUWI ↗</span>
              </a>
            </div>
          )}
        </div>

        {/* 4 Live KPI Strip (Matches LOYALTY_SPEC S09) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/70">
            <span className="text-xs font-bold text-slate-500 block mb-1">زيارات اليوم</span>
            <span className="text-3xl font-black text-blue-600 font-mono">
              {metrics.todayVisits}
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/70">
            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي الأعضاء</span>
            <span className="text-3xl font-black text-slate-900 font-mono">
              {metrics.totalMembers}
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/70">
            <span className="text-xs font-bold text-slate-500 block mb-1">
              قربوا على الهدية ({Math.max(1, program.stamps_required - 2)}–
              {program.stamps_required - 1} أختام)
            </span>
            <span className="text-3xl font-black text-amber-600 font-mono">
              {metrics.nearRewardMembers}
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/70">
            <span className="text-xs font-bold text-slate-500 block mb-1">
              وجبات مجانية تم صرفها
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 font-mono">
                {metrics.redeemedVouchers}
              </span>
              {metrics.activeVouchers > 0 && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  +{metrics.activeVouchers} جاهزة للصرف
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Program Quick Settings Form */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/70">
          <h2 className="text-lg font-black text-slate-900 mb-5">إعدادات برنامج الولاء</h2>

          <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                اسم المطعم / الكافيه
              </label>
              <input
                type="text"
                name="business_name"
                defaultValue={program.business_name}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            {isSuperAdmin ? (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  الرابط المختصر للمطعم (Slug بالإنجليزية — للمشرف)
                </label>
                <input
                  type="text"
                  name="slug"
                  dir="ltr"
                  defaultValue={program.slug}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono text-left focus:outline-none focus:border-blue-600"
                />
              </div>
            ) : (
              <input type="hidden" name="slug" value={program.slug} />
            )}

            <div className={isSuperAdmin ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                رابط المنيو الرقمي للمطعم (يُحوَّل إليه العميل بعد تسجيل الزيارة 🍽️)
              </label>
              <input
                type="url"
                name="menu_url"
                dir="ltr"
                defaultValue={parsedReward.menuUrl}
                placeholder="https://menu.your-restaurant.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono text-left focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                عنوان الهدية المجانية
              </label>
              <input
                type="text"
                name="reward_title"
                defaultValue={program.reward_title}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                لون هوية المطعم
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primary_color"
                  defaultValue={program.primary_color || '#1E3A8A'}
                  className="h-11 w-16 rounded-xl border border-slate-200 bg-slate-50 p-1 cursor-pointer"
                />
                <span className="text-xs text-slate-500">
                  يظهر على رأس بطاقة العميل والأزرار الرئيسية
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                شروط وأحكام المكافأة
              </label>
              <input
                type="text"
                name="reward_terms"
                defaultValue={parsedReward.terms}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                عدد الزيارات للحصول على الهدية
              </label>
              <select
                name="stamps_required"
                defaultValue={program.stamps_required}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} زيارات
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                الحد الأدنى للفاتورة (ج.م)
              </label>
              <input
                type="number"
                name="min_bill_egp"
                dir="ltr"
                min={0}
                defaultValue={program.min_bill_egp}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono text-left focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                فترة التهدئة بين الزيارات (بالساعات: 1 إلى 72)
              </label>
              <input
                type="number"
                name="cooldown_hours"
                dir="ltr"
                min={1}
                max={72}
                defaultValue={program.cooldown_hours}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono text-left focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                حالة استقبال الأختام
              </label>
              <select
                name="is_active"
                defaultValue={program.is_active ? 'true' : 'false'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600"
              >
                <option value="true">نشط (يستقبل أختام العملاء)</option>
                <option value="false">متوقف مؤقتاً</option>
              </select>
            </div>

            <div className="sm:col-span-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="py-3.5 px-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold rounded-2xl shadow-md transition text-sm cursor-pointer"
              >
                {isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </form>
        </section>

        {/* Recent Activity Table (Visits & Redemptions) */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/70">
          <h2 className="text-lg font-black text-slate-900 mb-4">
            آخر 20 عملية (أختام وصرف هدايا)
          </h2>

          {initialData.recentActivity.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-bold text-slate-400">
                لا توجد زيارات مسجلة بعد. افتح «معاينة كارت العميل» وجرب أول ختم بكود الكاشير!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="pb-3 pr-2">العميل</th>
                    <th className="pb-3 px-2">رقم الموبايل (للتسويق وإعادة الاستهداف)</th>
                    <th className="pb-3 px-2">العملية</th>
                    <th className="pb-3 px-2">الطاولة</th>
                    <th className="pb-3 pl-2 text-left">التوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialData.recentActivity.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pr-2 font-extrabold text-slate-900">
                        {item.member_name}
                      </td>
                      <td className="py-3.5 px-2">
                        {item.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 text-xs" dir="ltr">
                              {item.phone}
                            </span>
                            <a
                              href={`https://wa.me/2${item.phone.replace(/^0/, '')}?text=${encodeURIComponent(
                                `أهلاً يا ${item.member_name} من مطعم ${program.business_name} 🍽️، وحشتنا وليك هدية خاصة ومكافأة جاهزة عندنا في زيارتك الجاية!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              title="إرسال رسالة واتساب للعميل"
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-[10px] font-black transition"
                            >
                              واتساب 💬
                            </a>
                            <a
                              href={`tel:${item.phone}`}
                              title="اتصال هاتفي بالعميل"
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-[10px] font-black transition"
                            >
                              اتصال 📞
                            </a>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-500" dir="ltr">
                            ••••{item.phone_last4}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2">
                        {item.type === 'redemption' ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold px-2.5 py-0.5 rounded-lg inline-block">
                            🎁 صرف هدية ({item.voucher_code})
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-700 font-extrabold px-2.5 py-0.5 rounded-lg inline-block">
                            ختم رقم {item.stamp_number_after}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-slate-600">
                        {item.table_code ? `#${item.table_code}` : '—'}
                      </td>
                      <td className="py-3.5 pl-2 text-left text-slate-400 font-mono">
                        {new Date(item.created_at).toLocaleString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
