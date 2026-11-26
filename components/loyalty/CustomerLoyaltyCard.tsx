'use client';

import React, { useState, useTransition } from 'react';
import {
  LoyaltyVoucher,
  PublicLoyaltyMember,
  PublicLoyaltyProgram,
} from '@/types/loyalty';
import {
  lookupOrRegisterAndStamp,
  stampReturningMemberAction,
  redeemVoucherAction,
  recoverMemberCardByPhoneAction,
  switchAccountAction,
} from '@/app/actions/loyalty';
import PinBottomSheet from './PinBottomSheet';
import GoldenVoucherCard from './GoldenVoucherCard';
import MiniConfetti from './MiniConfetti';

interface CustomerLoyaltyCardProps {
  slug: string;
  program: PublicLoyaltyProgram;
  initialMember: PublicLoyaltyMember | null;
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
  const [member, setMember] = useState<PublicLoyaltyMember | null>(initialMember);
  const [activeVoucher, setActiveVoucher] = useState<LoyaltyVoucher | null>(
    initialActiveVoucher
  );
  const [isCooldown, setIsCooldown] = useState<boolean>(initialCooldown);
  const [remHours, setRemHours] = useState<number>(remainingHours);
  const [remMins, setRemMins] = useState<number>(remainingMinutes);

  // S02 Entry Mode ('new' first visit vs 'recover' returning without cookie)
  const [entryMode, setEntryMode] = useState<'new' | 'recover'>('new');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [suggestNewTab, setSuggestNewTab] = useState(false);

  // S03 PIN Bottom Sheet state
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [pinMode, setPinMode] = useState<'stamp' | 'redeem'>('stamp');
  const [pinFlowOrigin, setPinFlowOrigin] = useState<'register' | 'returning'>('returning');
  const [pinError, setPinError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  // Feedback & Celebration
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const stampsTotal = program.stamps_required || 6;
  const currentStamps = member?.current_stamps || 0;
  const brandColor = program.primary_color || '#1E3A8A';
  const isNearGoal = currentStamps >= Math.max(2, stampsTotal - 2) && currentStamps < stampsTotal;

  // Step 1A (New Customer): Validate S02 fields, then open S03 4-digit Cashier PIN sheet
  const handleStartRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuggestNewTab(false);
    setBannerSuccess(null);

    if (!phone.trim()) {
      setFormError('يرجى إدخال رقم الموبايل لحفظ أختامك.');
      return;
    }
    if (!consentAccepted) {
      setFormError('يرجى الموافقة على حفظ رقمك مشفراً لتسجيل الزيارات.');
      return;
    }

    setPinMode('stamp');
    setPinFlowOrigin('register');
    setPinError(null);
    setPinSheetOpen(true);
  };

  // Step 1B (Returning Customer after clearing cookies / switching phone): Instant Phone Recovery
  const handleRecoverCard = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuggestNewTab(false);
    setBannerSuccess(null);

    if (!phone.trim()) {
      setFormError('يرجى إدخال رقم الموبايل المسجل سابقاً.');
      return;
    }

    startTransition(async () => {
      const res = await recoverMemberCardByPhoneAction(slug, phone);
      if (!res.success || !res.member) {
        setFormError(res.error || 'لم نتمكن من العثور على بطاقة مسجلة بهذا الرقم.');
        if (res.notFoundInProgram) {
          setSuggestNewTab(true);
        }
        return;
      }

      setMember(res.member);
      setActiveVoucher(res.activeVoucher || null);
      setIsCooldown(res.status === 'cooldown');
      setRemHours(res.remainingHours || 0);
      setRemMins(res.remainingMinutes || 0);
      setBannerSuccess(`أهلاً بعودتك يا ${res.member.first_name}! تم استرجاع بطاقتك وأختامك بنجاح ✅`);
    });
  };

  // Triggered automatically when 4th digit is typed in PinBottomSheet
  const handleCompletePin = (enteredPin: string) => {
    setPinError(null);

    startTransition(async () => {
      if (pinMode === 'redeem' && activeVoucher) {
        const res = await redeemVoucherAction(slug, activeVoucher.id, enteredPin, tableCode);
        if (!res.success) {
          setPinError(res.error || 'الكود غير صحيح، راجع الكاشير وجرب تاني');
          setShakeKey((k) => k + 1);
          return;
        }

        if (res.member !== undefined) setMember(res.member);
        setActiveVoucher(null);
        setIsCooldown(res.status === 'cooldown');
        setRemHours(res.remainingHours || 0);
        setRemMins(res.remainingMinutes || 0);
        setPinSheetOpen(false);
        setBannerSuccess('تم تسليم الهدية بنجاح ✅ — بدأت دورتك الجديدة!');
        setConfettiKey((k) => k + 1);
        return;
      }

      // Stamp flow (new registration OR returning cookie session)
      const res =
        pinFlowOrigin === 'register' || !member
          ? await lookupOrRegisterAndStamp(
              slug,
              firstName,
              phone,
              enteredPin,
              tableCode,
              consentAccepted
            )
          : await stampReturningMemberAction(slug, enteredPin, tableCode);

      if (!res.success) {
        setPinError(res.error || 'الكود غير صحيح، راجع الكاشير وجرب تاني');
        setShakeKey((k) => k + 1);
        return;
      }

      if (res.member) setMember(res.member);
      if (res.activeVoucher !== undefined) setActiveVoucher(res.activeVoucher || null);

      if (res.status === 'cooldown') {
        setIsCooldown(true);
        setRemHours(res.remainingHours || 0);
        setRemMins(res.remainingMinutes || 0);
        setBannerSuccess(null);
      } else if (res.status === 'voucher_unlocked' || res.status === 'active_voucher') {
        setIsCooldown(false);
        setBannerSuccess('مبروك! وصلت للزيارة السادسة وفتحت قسيمة وجبتك المجانية 🎉');
        setConfettiKey((k) => k + 1);
      } else {
        setIsCooldown(false);
        setBannerSuccess('تم تسجيل زيارتك وإضافة ختم اليوم بنجاح! 🎉');
        setConfettiKey((k) => k + 1);
      }

      setPinSheetOpen(false);
    });
  };

  const handleSwitchAccount = () => {
    startTransition(async () => {
      await switchAccountAction(slug);
      setMember(null);
      setActiveVoucher(null);
      setIsCooldown(false);
      setBannerSuccess(null);
      setFormError(null);
      setSuggestNewTab(false);
      setFirstName('');
      setPhone('');
    });
  };

  return (
    <div
      className="min-h-screen bg-slate-100 flex items-start sm:items-center justify-center py-3 px-2.5 sm:p-4"
      dir="rtl"
    >
      <MiniConfetti triggerKey={confettiKey} />

      <div className="w-full max-w-[430px] bg-white rounded-[2rem] shadow-xl border border-slate-200/80 overflow-hidden flex flex-col">
        {/* Restaurant Hero Header */}
        <div
          className="px-6 pt-7 pb-6 text-white text-center relative overflow-hidden"
          style={{ backgroundColor: brandColor }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 -left-12 w-36 h-36 rounded-full bg-white/10 blur-2xl"
          />

          {tableCode && (
            <span className="inline-block mb-2 bg-black/25 border border-white/15 backdrop-blur-md text-[11px] font-bold px-3 py-0.5 rounded-full">
              طاولة #{tableCode}
            </span>
          )}

          {program.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={program.logo_url}
              alt={program.business_name}
              className="w-14 h-14 rounded-2xl object-cover mx-auto mb-2.5 border-2 border-white/30 bg-white"
            />
          ) : (
            <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-2.5 text-2xl">
              🍽️
            </div>
          )}

          <h1 className="text-2xl font-black tracking-tight mb-1">{program.business_name}</h1>

          {member ? (
            <p className="text-xs sm:text-sm text-white/95 font-bold">
              منور يا {member.first_name} 👋 • زيارتك رقم {currentStamps} من {stampsTotal}
            </p>
          ) : (
            <span className="inline-block mt-1 bg-white/15 border border-white/20 text-white text-xs font-extrabold px-3.5 py-1 rounded-full">
              «اجمع {stampsTotal - 1} زيارات.. والسادسة علينا مجاناً!»
            </span>
          )}
        </div>

        {/* Main Card Body */}
        <div className="p-5 flex-1 flex flex-col gap-4">
          {bannerSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-extrabold text-center animate-loyalty-pop">
              {bannerSuccess}
            </div>
          )}

          {member ? (
            /* ================= RETURNING / ACTIVE MEMBER VIEW (S04, S05, S07) ================= */
            <div className="flex flex-col gap-4">
              {/* S07 Golden 6th-Visit Voucher when active */}
              {activeVoucher && activeVoucher.status === 'active' && (
                <GoldenVoucherCard
                  firstName={member.first_name}
                  voucher={activeVoucher}
                  rewardTerms={program.reward_terms}
                  onRequestRedeem={() => {
                    setPinMode('redeem');
                    setPinFlowOrigin('returning');
                    setPinError(null);
                    setPinSheetOpen(true);
                  }}
                />
              )}

              {/* S05 Friendly Cooldown State */}
              {isCooldown && !activeVoucher && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <div className="text-emerald-800 font-black text-sm mb-1">
                    ✅ زيارتك النهارده اتسجلت بالفعل!
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    استمتع بوجبتك، تقدر تختم زيارتك الجاية بعد{' '}
                    <span className="font-black">{remHours} ساعة</span> و{' '}
                    <span className="font-black">{remMins} دقيقة</span>.
                  </p>
                </div>
              )}

              {/* Goal-Gradient Motivation Banner (Stamps 4 & 5) */}
              {!activeVoucher && (
                <div
                  className={`rounded-2xl p-3.5 text-center border transition ${
                    isNearGoal
                      ? 'bg-gradient-to-l from-amber-50 via-yellow-50 to-amber-50 border-amber-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <p
                    className={`text-xs font-extrabold ${
                      isNearGoal ? 'text-amber-900' : 'text-slate-700'
                    }`}
                  >
                    {currentStamps === stampsTotal - 1
                      ? '«خطوة واحدة وتاكل على حسابنا! 🔥»'
                      : currentStamps === stampsTotal - 2
                      ? '«قربت جداً! فاضلك زيارتين بس على الوجبة المجانية ✨»'
                      : currentStamps === 0
                      ? '«دورة ولاء جديدة! ابدأ بختم زيارتك اليوم 🚀»'
                      : `«فاضلك ${stampsTotal - currentStamps} زيارات على ${program.reward_title}»`}
                  </p>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden mt-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isNearGoal ? 'bg-gradient-to-l from-amber-500 to-yellow-400' : ''
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((currentStamps / stampsTotal) * 100))}%`,
                        backgroundColor: isNearGoal ? undefined : brandColor,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 6-Stamp Interactive Grid (3x2 on mobile) */}
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: stampsTotal }).map((_, idx) => {
                  const num = idx + 1;
                  const filled = num <= currentStamps;
                  const isFinalGift = num === stampsTotal;

                  return (
                    <div
                      key={num}
                      className={`min-h-[92px] rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all ${
                        filled
                          ? isFinalGift
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-white shadow-md shadow-amber-500/20'
                            : isNearGoal
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-blue-50/90 border-blue-200 text-blue-700'
                          : isFinalGift
                          ? 'bg-amber-50/50 border-amber-300 border-dashed text-amber-700'
                          : 'bg-slate-50 border-slate-200 border-dashed text-slate-400'
                      }`}
                    >
                      {filled ? (
                        isFinalGift ? (
                          <span className="text-2xl animate-bounce">🎁</span>
                        ) : (
                          <span
                            className="w-9 h-9 rounded-full text-white flex items-center justify-center text-lg font-black shadow-sm"
                            style={{ backgroundColor: isNearGoal ? '#d97706' : brandColor }}
                          >
                            ✓
                          </span>
                        )
                      ) : isFinalGift ? (
                        <span className="text-2xl">🎁</span>
                      ) : (
                        <span className="font-mono text-lg font-black opacity-45">{num}</span>
                      )}

                      <span className="text-[11px] font-extrabold mt-1.5">
                        {isFinalGift ? 'مجاناً' : `زيارة ${num}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Primary Returning Customer Stamp CTA (< 4s UX) */}
              {!isCooldown && !activeVoucher && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setPinMode('stamp');
                    setPinFlowOrigin('returning');
                    setPinError(null);
                    setPinSheetOpen(true);
                  }}
                  style={{ backgroundColor: brandColor }}
                  className="w-full min-h-[54px] py-4 text-white font-black rounded-2xl shadow-lg transition active:scale-[0.98] text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>اختم زيارتي اليوم</span>
                  <span>🏷️</span>
                </button>
              )}

              {/* Reward Terms & Footer */}
              <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                <p className="text-[11px] font-bold text-slate-700 mb-0.5">
                  🎁 المكافأة: {program.reward_title}
                </p>
                <p className="text-[10px] text-slate-500">
                  تُحتسب الزيارة عند حد أدنى للفاتورة {program.min_bill_egp} ج.م • {program.reward_terms}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span>
                  آخر زيارة:{' '}
                  {member.last_visit_at
                    ? new Date(member.last_visit_at).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'اليوم'}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSwitchAccount}
                  className="text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  تبديل الرقم / مش أنا؟
                </button>
              </div>
            </div>
          ) : (
            /* ================= S02 ENTRY: NEW CUSTOMER OR INSTANT CARD RECOVERY ================= */
            <div className="flex flex-col gap-4">
              {/* 2-Tab Mode Switcher: New Customer vs Recover Saved Stamps */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('new');
                    setFormError(null);
                    setSuggestNewTab(false);
                  }}
                  className={`py-2.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    entryMode === 'new'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  زيارة أولى / عضو جديد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('recover');
                    setFormError(null);
                    setSuggestNewTab(false);
                  }}
                  className={`py-2.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    entryMode === 'recover'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  عندي أختام سابقة 🔄
                </button>
              </div>

              {entryMode === 'recover' ? (
                /* ---------- INSTANT PHONE RECOVERY FORM (NO PIN NEEDED TO VIEW CARD) ---------- */
                <form onSubmit={handleRecoverCard} className="flex flex-col gap-4">
                  <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 text-center">
                    <p className="text-xs font-extrabold text-blue-900 mb-0.5">
                      مسحت الكوكيز أو غيرت موبايلك؟ ولا يهمك! 💾
                    </p>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      اكتب رقم موبايلك المسجل وهنفتحلك كارتك وكل أختامك وقسائمك المحفوظة فوراً بدون كود كاشير.
                    </p>
                  </div>

                  {formError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold text-center animate-loyalty-shake">
                      <p>{formError}</p>
                      {suggestNewTab && (
                        <button
                          type="button"
                          onClick={() => {
                            setEntryMode('new');
                            setFormError(null);
                            setSuggestNewTab(false);
                          }}
                          className="mt-2 inline-block px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-[11px] font-extrabold cursor-pointer"
                        >
                          سجّل الآن كعضو جديد بهذا الرقم ←
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      رقم موبايلك المسجل
                    </label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full min-h-[50px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition text-left"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    style={{ backgroundColor: brandColor }}
                    className="w-full min-h-[54px] py-4 text-white font-black rounded-2xl shadow-lg transition active:scale-[0.98] disabled:opacity-60 text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري استرجاع أختامك...</span>
                      </>
                    ) : (
                      <>
                        <span>استرجع كرتي وأختامي الآن</span>
                        <span>⚡</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* ---------- S02 FAST FIRST-VISIT REGISTRATION (<= 12s) ---------- */
                <form onSubmit={handleStartRegistration} className="flex flex-col gap-4">
                  {/* Compact Visual Preview of 6 Empty Stamp Circles */}
                  <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between gap-1.5">
                      {Array.from({ length: stampsTotal }).map((_, idx) => {
                        const isGift = idx + 1 === stampsTotal;
                        return (
                          <div
                            key={idx}
                            className={`flex-1 h-11 rounded-xl border flex items-center justify-center text-xs font-black ${
                              isGift
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'bg-white border-slate-200 border-dashed text-slate-400 font-mono'
                            }`}
                          >
                            {isGift ? '🎁' : idx + 1}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-center text-slate-600 font-bold mt-2.5">
                      🎁 مكافأتك: <span className="text-slate-900">{program.reward_title}</span>
                    </p>
                  </div>

                  {formError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold text-center animate-loyalty-shake">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      اسمك الأول
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="مثال: أحمد"
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      رقم موبايلك
                    </label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition text-left"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      عشان نحفظلك أختامك حتى لو مسحت الكوكيز أو غيرت الموبايل
                    </span>
                  </div>

                  {/* Egypt Law 151/2020 Privacy Consent */}
                  <label className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      أوافق على حفظ رقمي مشفّراً لتسجيل زياراتي في برنامج الولاء فقط.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isPending}
                    style={{ backgroundColor: brandColor }}
                    className="w-full min-h-[54px] py-4 text-white font-black rounded-2xl shadow-lg transition active:scale-[0.98] text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>ابدأ واختم زيارتك الأولى</span>
                    <span>🚀</span>
                  </button>

                  <p className="text-center text-[11px] text-slate-400 font-semibold">
                    تُحتسب الزيارة عند حد أدنى للفاتورة {program.min_bill_egp} ج.م
                  </p>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Clean Micro-Footer */}
        <div className="py-2.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
          كارت الولاء الرقمي السريع • بدون تطبيقات
        </div>
      </div>

      {/* S03 Cashier PIN Verification Bottom Sheet */}
      <PinBottomSheet
        open={pinSheetOpen}
        mode={pinMode}
        primaryColor={brandColor}
        isSubmitting={isPending}
        errorMsg={pinError}
        shakeKey={shakeKey}
        onClose={() => setPinSheetOpen(false)}
        onCompletePin={handleCompletePin}
      />
    </div>
  );
}
