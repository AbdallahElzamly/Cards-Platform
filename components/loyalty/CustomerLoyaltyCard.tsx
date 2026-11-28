'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  LoyaltyVoucher,
  PublicLoyaltyMember,
  PublicLoyaltyProgram,
} from '@/types/loyalty';
import { parseRewardTermsAndMenu } from '@/lib/loyalty-menu';
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

  // Feedback, Celebration & Post-Stamp Menu Redirect
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [menuCountdown, setMenuCountdown] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedReward = parseRewardTermsAndMenu(program.reward_terms);
  const menuUrl = parsedReward.menuUrl;
  const cleanRewardTerms = parsedReward.terms;

  const stampsTotal = program.stamps_required || 6;
  const currentStamps = member?.current_stamps || 0;
  const remainingVisits = Math.max(0, stampsTotal - currentStamps);
  const brandColor = program.primary_color || '#1E3A8A';
  const isNearGoal = currentStamps >= Math.max(2, stampsTotal - 2) && currentStamps < stampsTotal;

  // Optional 5-second post-stamp redirect countdown to Restaurant Digital Menu
  useEffect(() => {
    if (!menuUrl || menuCountdown === null) return;
    if (menuCountdown <= 0) {
      window.location.assign(menuUrl);
      return;
    }
    const timer = window.setTimeout(() => {
      setMenuCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [menuCountdown, menuUrl]);

  // CRO & Apple HIG: Continuous celebration active whenever the member card is open with remaining visits or unlocked voucher
  const isCelebrationActive = Boolean(member && (remainingVisits > 0 || activeVoucher));

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
      setFormError('يرجى الموافقة على حفظ رقمك لتسجيل الزيارات.');
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
      setBannerSuccess(`أهلاً بعودتك يا ${res.member.first_name}! تم استرجاع بطاقتك وأختامك بنجاح ✨`);
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
        if (menuUrl) setMenuCountdown(6);
      } else {
        setIsCooldown(false);
        setBannerSuccess('تم تسجيل زيارتك وإضافة ختم اليوم بنجاح! 🎈');
        if (menuUrl) setMenuCountdown(5);
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
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex items-start sm:items-center justify-center py-2 px-3 sm:p-5 relative"
      dir="rtl"
    >
      {/* Continuous Celebration: Floating Balloons & Confetti Rain while viewing remaining visits */}
      <MiniConfetti active={isCelebrationActive} />

      <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-slate-300/60 border border-white/60 overflow-hidden flex flex-col relative z-10 transition-all duration-300">
        
        {/* Apple HIG Fluid Header with Dynamic Ambient Glow */}
        <div
          className="px-6 pt-7 pb-6 text-white text-center relative overflow-hidden transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, #0f172a 120%)`,
          }}
        >
          {/* Subtle Ambient Radial Light */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-white/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -right-16 w-44 h-44 rounded-full bg-amber-400/20 blur-3xl"
          />

          {tableCode && (
            <span className="inline-block mb-3 bg-black/30 border border-white/20 backdrop-blur-md text-[11px] font-extrabold px-3.5 py-1 rounded-full tracking-wide shadow-xs">
              طاولة #{tableCode}
            </span>
          )}

          {program.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={program.logo_url}
              alt={program.business_name}
              className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 border-2 border-white/40 bg-white shadow-md transform transition hover:scale-105"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-3 text-3xl shadow-md">
              🍽️
            </div>
          )}

          <h1 className="text-2xl font-black tracking-tight mb-1 drop-shadow-xs">
            {program.business_name}
          </h1>

          {member ? (
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1 rounded-full mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-white font-extrabold">
                أهلاً {member.first_name} • الختم {currentStamps} من {stampsTotal}
              </p>
            </div>
          ) : (
            <span className="inline-block mt-1 bg-amber-400/25 border border-amber-300/40 text-amber-200 text-xs font-black px-4 py-1.5 rounded-full shadow-xs">
              «اجمع {stampsTotal - 1} أختام.. والسادسة وجبتك مجاناً!»
            </span>
          )}
        </div>

        {/* Main Interactive Card Body */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col gap-4">
          {bannerSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 rounded-2xl text-xs font-black text-center animate-loyalty-pop shadow-xs flex items-center justify-center gap-2">
              <span>{bannerSuccess}</span>
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
                  rewardTerms={cleanRewardTerms}
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
                <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 text-center shadow-xs">
                  <div className="text-emerald-900 font-black text-sm mb-1 flex items-center justify-center gap-1.5">
                    <span>✅ زيارتك اليوم اتسجلت بالفعل!</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    بالهنا والشفا، تقدر تختم زيارتك الجاية بعد{' '}
                    <span className="font-black text-emerald-950">{remHours} ساعة</span> و{' '}
                    <span className="font-black text-emerald-950">{remMins} دقيقة</span>.
                  </p>
                </div>
              )}

              {/* Apple HIG & CRO Goal-Gradient Hero Card (Continuous Balloon Motivation) */}
              {!activeVoucher && (
                <div
                  className={`rounded-3xl p-4 text-center border transition-all duration-300 relative overflow-hidden ${
                    isNearGoal
                      ? 'bg-gradient-to-br from-amber-500/15 via-yellow-400/10 to-amber-500/20 border-amber-300 shadow-md animate-pulse-glow'
                      : 'bg-slate-50/90 border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-500">
                      نسبة التقدم للمكافأة
                    </span>
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full font-mono">
                      {Math.round((currentStamps / stampsTotal) * 100)}%
                    </span>
                  </div>

                  <p
                    className={`text-sm font-black mb-3 ${
                      isNearGoal ? 'text-amber-950' : 'text-slate-800'
                    }`}
                  >
                    {remainingVisits === 0
                      ? '«وجبتك المجانية جاهزة للاستلام الآن! 🎁»'
                      : remainingVisits === 1
                      ? '«خطوة واحدة وتاكل على حسابنا! 🔥 فاضل زيارة واحدة!»'
                      : remainingVisits === 2
                      ? '«قربت جداً! فاضلك زيارتين بس على الوجبة المجانية ✨»'
                      : `«فاضلك ${remainingVisits} زيارات وتاكل مجاناً على حسابنا 🎈»`}
                  </p>

                  {/* High-Performance Progress Bar */}
                  <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                      style={{
                        width: `${Math.min(100, Math.round((currentStamps / stampsTotal) * 100))}%`,
                        background: isNearGoal
                          ? 'linear-gradient(90deg, #f59e0b 0%, #eab308 100%)'
                          : brandColor,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 6-Stamp Interactive Grid (Tactile Touch Cards) */}
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: stampsTotal }).map((_, idx) => {
                  const num = idx + 1;
                  const filled = num <= currentStamps;
                  const isFinalGift = num === stampsTotal;

                  return (
                    <div
                      key={num}
                      className={`min-h-[96px] rounded-2xl border-2 flex flex-col items-center justify-center p-2.5 transition-all duration-200 select-none ${
                        filled
                          ? isFinalGift
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-white shadow-lg shadow-amber-500/25 scale-[1.02]'
                            : isNearGoal
                            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                            : 'bg-blue-50/90 border-blue-200 text-blue-800 shadow-xs'
                          : isFinalGift
                          ? 'bg-amber-50/50 border-amber-300 border-dashed text-amber-700'
                          : 'bg-slate-50 border-slate-200 border-dashed text-slate-400'
                      }`}
                    >
                      {filled ? (
                        isFinalGift ? (
                          <span className="text-3xl animate-bounce">🎁</span>
                        ) : (
                          <span
                            className="w-10 h-10 rounded-full text-white flex items-center justify-center text-lg font-black shadow-sm transform transition active:scale-95"
                            style={{ backgroundColor: isNearGoal ? '#d97706' : brandColor }}
                          >
                            ✓
                          </span>
                        )
                      ) : isFinalGift ? (
                        <span className="text-2xl opacity-75">🎁</span>
                      ) : (
                        <span className="font-mono text-xl font-black opacity-40">{num}</span>
                      )}

                      <span className="text-[11px] font-black mt-2">
                        {isFinalGift ? 'مجاناً' : `زيارة ${num}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Primary Stamp CTA Button (Apple HIG 54px Touch Target) */}
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
                  className="w-full min-h-[56px] py-4 px-6 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all duration-200 active:scale-[0.97] hover:brightness-110 text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>اختم زيارتي الآن</span>
                  <span className="text-lg">🏷️</span>
                </button>
              )}

              {/* Digital Menu Redirect CTA (After Visit / Always Accessible) */}
              {menuUrl && (
                <div className="bg-[#0B0B0F] text-white rounded-2xl p-4 flex flex-col gap-2.5 border border-white/10">
                  {menuCountdown !== null && menuCountdown > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-[#C8FF2E] font-bold">
                      <span>جاري تحويلك تلقائياً إلى المنيو خلال {menuCountdown} ثوانٍ...</span>
                      <button
                        type="button"
                        onClick={() => setMenuCountdown(null)}
                        className="underline text-white/80 hover:text-white cursor-pointer"
                      >
                        إلغاء التحويل
                      </button>
                    </div>
                  )}
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[48px] py-3 px-4 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-black rounded-xl text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    <span>تصفح المنيو واطلب الآن</span>
                    <span>🍽️</span>
                  </a>
                </div>
              )}

              {/* Reward Terms & Details */}
              <div className="bg-slate-50/80 rounded-2xl p-3.5 text-center border border-slate-200/60">
                <p className="text-xs font-black text-slate-800 mb-0.5">
                  🎁 المكافأة: {program.reward_title}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  تُحتسب الزيارة عند حد أدنى للفاتورة {program.min_bill_egp} ج.م
                  {cleanRewardTerms ? ` • ${cleanRewardTerms}` : ''}
                </p>
              </div>

              {/* Account Switcher */}
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
                  className="text-rose-600 hover:text-rose-700 font-black cursor-pointer transition active:scale-95"
                >
                  تبديل الرقم / مش أنا؟
                </button>
              </div>
            </div>
          ) : (
            /* ================= S02 ENTRY: NEW CUSTOMER OR INSTANT CARD RECOVERY ================= */
            <div className="flex flex-col gap-4">
              
              {/* 2-Segmented iOS Control Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('new');
                    setFormError(null);
                    setSuggestNewTab(false);
                  }}
                  className={`py-3 text-xs font-black rounded-xl transition-all duration-200 cursor-pointer ${
                    entryMode === 'new'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  عضو جديد 🚀
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('recover');
                    setFormError(null);
                    setSuggestNewTab(false);
                  }}
                  className={`py-3 text-xs font-black rounded-xl transition-all duration-200 cursor-pointer ${
                    entryMode === 'recover'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  عندي أختام سابقة 🔄
                </button>
              </div>

              {entryMode === 'recover' ? (
                /* ---------- INSTANT PHONE RECOVERY (NO PIN TO VIEW) ---------- */
                <form onSubmit={handleRecoverCard} className="flex flex-col gap-4">
                  <div className="bg-blue-50/90 border border-blue-200/80 rounded-2xl p-4 text-center shadow-xs">
                    <p className="text-xs font-black text-blue-950 mb-1">
                      مسحت الكوكيز أو غيرت جهازك؟ ولا يهمك! 💾
                    </p>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      اكتب رقم موبايلك وهنفتحلك كارتك وكل أختامك وهداياك المحفوظة فوراً وبدون كود كاشير.
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
                          className="mt-2.5 inline-block px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs active:scale-95 transition"
                        >
                          سجّل كعضو جديد بهذا الرقم ←
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
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
                      className="w-full min-h-[52px] px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 text-base font-mono tracking-wider focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition text-left"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    style={{ backgroundColor: brandColor }}
                    className="w-full min-h-[56px] py-4 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all duration-200 active:scale-[0.97] hover:brightness-110 disabled:opacity-60 text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري استرجاع أختامك...</span>
                      </>
                    ) : (
                      <>
                        <span>استرجع كارتي وأختامي فوراً</span>
                        <span>⚡</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* ---------- S02 FAST FIRST-VISIT REGISTRATION (CRO HIGH CONVERSION) ---------- */
                <form onSubmit={handleStartRegistration} className="flex flex-col gap-4">
                  {/* Visual Preview of Stamps Goal */}
                  <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      {Array.from({ length: stampsTotal }).map((_, idx) => {
                        const isGift = idx + 1 === stampsTotal;
                        return (
                          <div
                            key={idx}
                            className={`flex-1 h-11 rounded-xl border flex items-center justify-center text-xs font-black ${
                              isGift
                                ? 'bg-amber-100/80 border-amber-300 text-amber-800 shadow-xs'
                                : 'bg-white border-slate-200/90 border-dashed text-slate-400 font-mono'
                            }`}
                          >
                            {isGift ? '🎁' : idx + 1}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-center text-slate-700 font-extrabold">
                      🎁 هديتك المجانية: <span className="text-slate-950 underline underline-offset-4 decoration-amber-400 font-black">{program.reward_title}</span>
                    </p>
                  </div>

                  {formError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold text-center animate-loyalty-shake">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      اسمك الأول (اختياري)
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="مثال: أحمد"
                      className="w-full min-h-[50px] px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      رقم موبايلك (ضروري لحفظ أختامك)
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
                      className="w-full min-h-[50px] px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 text-base font-mono tracking-wider focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition text-left"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      بنحفظ رقمك عند {program.business_name} عشان نسجّل أختامك ويبعتلك عروض ومكافآت خاصة 🎁
                    </span>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                      أوافق على حفظ رقم موبايلي لدى {program.business_name} لتسجيل زياراتي ومكافآتي، والتواصل معي بعروض المطعم عبر واتساب أو الهاتف.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isPending}
                    style={{ backgroundColor: brandColor }}
                    className="w-full min-h-[56px] py-4 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all duration-200 active:scale-[0.97] hover:brightness-110 text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>ابدأ واختم زيارتك الأولى الآن</span>
                    <span className="text-lg">🚀</span>
                  </button>

                  <p className="text-center text-[11px] text-slate-400 font-semibold">
                    تُحتسب الزيارة عند حد أدنى للفاتورة {program.min_bill_egp} ج.م
                  </p>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Apple iOS Subtle Micro-Footer */}
        <div className="py-3 bg-slate-50/90 border-t border-slate-100 text-center text-[11px] text-slate-400 font-bold">
          كارت ولاء إلكتروني سريع • بدون تحميل تطبيقات ⚡
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
