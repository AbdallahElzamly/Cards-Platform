'use client';

import React, { useEffect, useState } from 'react';
import { LoyaltyVoucher } from '@/types/loyalty';

interface GoldenVoucherCardProps {
  firstName: string;
  voucher: LoyaltyVoucher;
  rewardTerms: string;
  onRequestRedeem: () => void;
}

/**
 * Screen S07 — Golden 6th-Visit Free Meal Voucher (Anti-Screenshot Live Clock Shield)
 */
export default function GoldenVoucherCard({
  firstName,
  voucher,
  rewardTerms,
  onRequestRedeem,
}: GoldenVoucherCardProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initialTick = setTimeout(() => {
      setNow(new Date());
    }, 0);
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearTimeout(initialTick);
      clearInterval(interval);
    };
  }, []);

  const liveTime = now
    ? now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '--:--:--';

  const liveDate = now
    ? now.toLocaleDateString('ar-EG', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 p-5 text-white shadow-xl shadow-amber-500/25 border border-amber-300/60">
      {/* Subtle CSS Shimmer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-24 bg-white/20 blur-md animate-loyalty-shimmer"
      />

      {/* Live Anti-Screenshot Bar */}
      <div className="relative flex items-center justify-between gap-2 bg-slate-950/35 backdrop-blur-md px-3.5 py-2 rounded-2xl mb-4 border border-white/15">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-extrabold text-emerald-100">قسيمة حية ومباشرة</span>
        </div>
        <div dir="ltr" className="text-right">
          <span className="font-mono text-sm font-black tracking-widest text-white block leading-none">
            {liveTime}
          </span>
          {liveDate && (
            <span className="text-[9px] text-white/80 block mt-0.5 font-sans" dir="rtl">
              {liveDate}
            </span>
          )}
        </div>
      </div>

      {/* Voucher Details */}
      <div className="relative text-center mb-4">
        <p className="text-xs font-extrabold text-amber-950 bg-white/85 inline-block px-3 py-1 rounded-full mb-2">
          مبروك يا {firstName}! 🎉
        </p>
        <h3 className="text-xl font-black tracking-tight mb-1 drop-shadow-sm">
          {voucher.reward_title}
        </h3>
        <p className="text-xs text-white/95 leading-relaxed mb-3">{rewardTerms}</p>

        <div className="inline-flex items-center gap-2 bg-black/25 border border-white/20 px-4 py-1.5 rounded-xl">
          <span className="text-[11px] text-white/80">كود القسيمة:</span>
          <span dir="ltr" className="font-mono text-sm font-black tracking-widest">
            {voucher.voucher_code}
          </span>
        </div>
      </div>

      {/* Cashier Warning + Burn CTA */}
      <div className="relative pt-3 border-t border-white/25">
        <p className="text-[11px] font-extrabold text-center text-amber-950 bg-amber-200/90 py-1.5 px-3 rounded-xl mb-2.5">
          ⚠️ للكاشير فقط — لا تضغط إلا أمام الكاشير
        </p>
        <button
          type="button"
          onClick={onRequestRedeem}
          className="w-full min-h-[50px] py-3.5 px-4 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black rounded-2xl shadow-lg transition active:scale-[0.99] text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>تأكيد تسليم الوجبة المجانية (للكاشير)</span>
          <span>🔓</span>
        </button>
      </div>
    </div>
  );
}
