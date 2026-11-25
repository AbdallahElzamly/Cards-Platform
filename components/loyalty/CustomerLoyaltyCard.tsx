'use client';

import React, { useState, useTransition } from 'react';
import { LoyaltyMember, LoyaltyProgram, LoyaltyVoucher } from '@/types/loyalty';
import {
  lookupOrRegisterAndStamp,
  redeemVoucherAction,
  switchAccountAction,
} from '@/app/actions/loyalty';

interface CustomerLoyaltyCardProps {
  slug: string;
  program: LoyaltyProgram;
  initialMember: LoyaltyMember | null;
  initialActiveVoucher: LoyaltyVoucher | null;
  initialCooldown: boolean;
  remainingHours: number;
  remainingMinutes: number;
  tableCode?: string;
}

export default function CustomerLoyaltyCard({
  slug,
  program,
  initialMember,
  initialActiveVoucher,
  initialCooldown,
  remainingHours,
  remainingMinutes,
  tableCode,
}: CustomerLoyaltyCardProps) {
  const [member, setMember] = useState<LoyaltyMember | null>(initialMember);
  const [activeVoucher, setActiveVoucher] = useState<LoyaltyVoucher | null>(initialActiveVoucher);
  const [isCooldown, setIsCooldown] = useState<boolean>(initialCooldown);
  const [remHours, setRemHours] = useState<number>(remainingHours);
  const [remMins, setRemMins] = useState<number>(remainingMinutes);

  // Form states for registration / stamping
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(true);

  // Modal / UI states
  const [showPinModal, setShowPinModal] = useState(false);
  const [modalMode, setModalMode] = useState<'stamp' | 'redeem'>('stamp');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stampsTotal = program.stamps_required;
  const currentStamps = member?.current_stamps || 0;

  // Handle registration / first stamp
  const handleRegisterAndStamp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!firstName.trim()) {
      setErrorMsg('يرجى إدخال اسمك الأول');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الموبايل');
      return;
    }
    if (!pin || pin.length !== 4) {
      setErrorMsg('يرجى إدخال كود الكاشير المكون من 4 أرقام');
      return;
    }
    if (!consentAccepted) {
      setErrorMsg('يجب الموافقة على شروط الخصوصية للاستمرار');
      return;
    }

    startTransition(async () => {
      const res = await lookupOrRegisterAndStamp(
        slug,
        firstName,
        phone,
        pin,
        tableCode,
        consentAccepted
      );

      if (!res.success) {
        setErrorMsg(res.error || 'حدث خطأ، يرجى المحاولة مرة أخرى');
      } else {
        if (res.member) setMember(res.member);
        if (res.activeVoucher !== undefined) setActiveVoucher(res.activeVoucher || null);
        if (res.status === 'cooldown') {
          setIsCooldown(true);
          setRemHours(res.remainingHours || 0);
          setRemMins(res.remainingMinutes || 0);
        } else {
          setIsCooldown(false);
          setSuccessMsg('تم تسجيل زيارتك بنجاح! 🎉');
        }
        setPin('');
      }
    });
  };

  // Handle stamping via Modal for returning member
  const handleStampWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!pin || pin.length !== 4) {
      setErrorMsg('يرجى إدخال كود الكاشير المكون من 4 أرقام');
      return;
    }

    startTransition(async () => {
      // Use member's stored phone or recover
      const res = await lookupOrRegisterAndStamp(
        slug,
        member?.first_name || 'صديق المطعم',
        member ? `01${member.phone_last4}` : '', // fallback
        pin,
        tableCode,
        true
      );

      if (!res.success) {
        setErrorMsg(res.error || 'الكود غير صحيح أو حدث خطأ');
      } else {
        if (res.member) setMember(res.member);
        if (res.activeVoucher !== undefined) setActiveVoucher(res.activeVoucher || null);
        if (res.status === 'cooldown') {
          setIsCooldown(true);
          setRemHours(res.remainingHours || 0);
          setRemMins(res.remainingMinutes || 0);
        } else {
          setIsCooldown(false);
          setSuccessMsg('تم إضافة ختم اليوم بنجاح! 🔥');
        }
        setShowPinModal(false);
        setPin('');
      }
    });
  };

  // Handle voucher redemption
  const handleRedeemVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!activeVoucher) return;
    if (!pin || pin.length !== 4) {
      setErrorMsg('يرجى إدخال كود الكاشير المكون من 4 أرقام لتأكيد الاستبدال');
      return;
    }

    startTransition(async () => {
      const res = await redeemVoucherAction(slug, activeVoucher.id, pin, tableCode);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل استبدال القسيمة');
      } else {
        setSuccessMsg('تم تسليم الهدية بنجاح ✅ — بدأت دورتك الجديدة!');
        if (res.member) setMember(res.member);
        setActiveVoucher(null);
        setShowPinModal(false);
        setPin('');
      }
    });
  };

  // Switch account / reset session
  const handleSwitchAccount = () => {
    startTransition(async () => {
      await switchAccountAction(slug);
      setMember(null);
      setActiveVoucher(null);
      setIsCooldown(false);
      setFirstName('');
      setPhone('');
      setPin('');
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-4 px-2 sm:px-4 font-sans" dir="rtl">
      <div className="w-full max-w-[430px] bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/80 flex flex-col">
        
        {/* Header / Brand Hero */}
        <div 
          className="p-6 text-white text-center relative"
          style={{ backgroundColor: program.primary_color || '#1E3A8A' }}
        >
          {tableCode && (
            <span className="absolute top-3 left-4 bg-white/20 backdrop-blur-md text-xs px-2.5 py-1 rounded-full font-mono">
              طاولة #{tableCode}
            </span>
          )}
          <h1 className="text-2xl font-black tracking-tight mb-1">{program.business_name}</h1>
          <p className="text-xs text-white/90 font-medium">
            {member ? `منور يا ${member.first_name} 👋` : `«اجمع ${stampsTotal - 1} زيارات.. والسادسة علينا مجاناً!»`}
          </p>
        </div>

        {/* Main Content Area */}
        <div className="p-5 flex-1 flex flex-col gap-5">

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold text-center animate-pulse">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {/* STATE 1: MEMBER LOGGED IN / REGISTERED */}
          {member ? (
            <div className="flex flex-col gap-5">
              
              {/* Status Banner / Goal Gradient */}
              <div className="bg-gradient-to-l from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-200/60 rounded-2xl p-4 text-center">
                <div className="text-xs font-bold text-amber-800 mb-1">
                  زيارتك رقم {currentStamps} من {stampsTotal}
                </div>
                <p className="text-[11px] text-slate-600">
                  {currentStamps === stampsTotal - 1
                    ? '«خطوة واحدة وتاكل على حسابنا! 🔥»'
                    : currentStamps >= stampsTotal
                    ? '«مبروك! استمتع بوجبتك المجانية 🎉»'
                    : `«فاضل لك ${stampsTotal - currentStamps} زيارات وتوصل للهدية!»`}
                </p>
              </div>

              {/* Stamp Grid (3x2) */}
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: stampsTotal }).map((_, idx) => {
                  const stampNum = idx + 1;
                  const isFilled = stampNum <= currentStamps;
                  const isLast = stampNum === stampsTotal;

                  return (
                    <div
                      key={idx}
                      className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                        isFilled
                          ? isLast
                            ? 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-300 text-white shadow-md shadow-amber-500/20'
                            : 'bg-blue-50/80 border-blue-200 text-blue-600'
                          : 'bg-slate-50 border-slate-200/80 text-slate-300 border-dashed'
                      }`}
                    >
                      {isFilled ? (
                        isLast ? (
                          <span className="text-2xl animate-bounce">🎁</span>
                        ) : (
                          <span className="text-2xl font-bold">✓</span>
                        )
                      ) : (
                        <span className="text-lg font-mono font-bold opacity-40">{stampNum}</span>
                      )}
                      <span className="text-[10px] font-semibold mt-1 opacity-80">
                        {isLast ? 'هدية 🎁' : `ختم ${stampNum}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Active Voucher Banner (S07) */}
              {activeVoucher && activeVoucher.status === 'active' && (
                <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white rounded-2xl p-5 shadow-lg shadow-amber-500/20 relative overflow-hidden">
                  <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-white/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      قسيمة حية نشطة
                    </span>
                    <span className="font-mono text-xs font-bold tracking-widest bg-black/20 px-2 py-0.5 rounded">
                      {activeVoucher.voucher_code}
                    </span>
                  </div>
                  <h3 className="font-bold text-base mb-1">{activeVoucher.reward_title}</h3>
                  <p className="text-xs text-white/90 mb-4">{program.reward_terms}</p>
                  
                  <button
                    onClick={() => {
                      setModalMode('redeem');
                      setShowPinModal(true);
                      setErrorMsg(null);
                    }}
                    className="w-full py-3 bg-white text-amber-900 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition text-sm flex items-center justify-center gap-2"
                  >
                    <span>تأكيد تسليم الهدية (للكاشير) 🔓</span>
                  </button>
                </div>
              )}

              {/* Cooldown State (S05) or Stamp CTA */}
              {isCooldown ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <div className="text-emerald-700 font-bold text-sm mb-1">✅ زيارتك النهارده اتسجلت بالفعل!</div>
                  <p className="text-xs text-slate-600">
                    تقدر تختم زيارتك الجاية بعد {remHours} ساعة و {remMins} دقيقة.
                  </p>
                </div>
              ) : (
                !activeVoucher && (
                  <button
                    onClick={() => {
                      setModalMode('stamp');
                      setShowPinModal(true);
                      setErrorMsg(null);
                    }}
                    disabled={isPending}
                    className="w-full py-4 text-white font-bold rounded-2xl shadow-lg transition transform active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                    style={{ backgroundColor: program.primary_color || '#1E3A8A' }}
                  >
                    <span>{isPending ? 'جاري التسجيل...' : 'اختم زيارتي اليوم 🏷️'}</span>
                  </button>
                )
              )}

              {/* Footer info & Switch Account */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>آخر زيارة: {member.last_visit_at ? new Date(member.last_visit_at).toLocaleDateString('ar-EG') : 'اليوم'}</span>
                <button
                  onClick={handleSwitchAccount}
                  className="text-rose-600 hover:underline font-medium"
                >
                  تبديل الرقم / ليس أنا؟
                </button>
              </div>

            </div>
          ) : (

            /* STATE 2: FIRST TIME VISITOR / UNREGISTERED (S02) */
            <form onSubmit={handleRegisterAndStamp} className="flex flex-col gap-4">
              
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-center">
                <p className="text-xs text-blue-900 font-medium">
                  املأ بياناتك البسيطة وابدأ جمع الأختام فوراً بدون تحميل أي تطبيقات!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسمك الأول</label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="مثال: أحمد"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الموبايل المصري</label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-right font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">عشان نحفظ أختامك حتى لو غيرت الموبايل</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">كود الكاشير اليومي (4 أرقام)</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  dir="ltr"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-center font-mono tracking-widest text-lg"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">اسأل الكاشير عن كود اليوم</span>
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-600 leading-tight">
                  أوافق على حفظ رقمي مشفراً لتسجيل زياراتي في برنامج الولاء فقط (قانون حماية البيانات).
                </span>
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 text-white font-bold rounded-2xl shadow-lg transition transform active:scale-[0.98] flex items-center justify-center gap-2 text-base mt-2"
                style={{ backgroundColor: program.primary_color || '#1E3A8A' }}
              >
                <span>{isPending ? 'جاري التسجيل...' : 'ابدأ واختم زيارتك الأولى 🚀'}</span>
              </button>

              <div className="text-center mt-2 text-[11px] text-slate-400 font-medium">
                تُحتسب الزيارة عند حد أدنى للفاتورة {program.min_bill_egp} ج.م
              </div>

            </form>
          )}

        </div>

        {/* Footer micro-branding */}
        <div className="py-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          نظام ولاء المطاعم الذكي • مدعوم بتقنية NFC & QR
        </div>

      </div>

      {/* PIN Verification Modal (S03) */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                {modalMode === 'redeem' ? '🔓' : '🏷️'}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {modalMode === 'redeem' ? 'كود كاشير لتأكيد الهدية' : 'أدخل كود الكاشير اليومي'}
              </h3>
              <p className="text-xs text-slate-500">
                {modalMode === 'redeem'
                  ? 'اسأل الكاشير لإدخال كود التأكيد وصرف الوجبة المجانية'
                  : 'اسأل الكاشير عن الكود المكون من 4 أرقام'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <form
              onSubmit={modalMode === 'redeem' ? handleRedeemVoucher : handleStampWithPin}
              className="flex flex-col gap-4"
            >
              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={4}
                  dir="ltr"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-center font-mono text-2xl tracking-widest focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 text-white font-bold rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: program.primary_color || '#1E3A8A' }}
              >
                <span>{isPending ? 'جاري التحقق...' : 'تأكيد وإتمام'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
