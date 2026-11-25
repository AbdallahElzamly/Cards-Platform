'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PinBottomSheetProps {
  open: boolean;
  mode: 'stamp' | 'redeem';
  primaryColor: string;
  isSubmitting: boolean;
  errorMsg: string | null;
  shakeKey: number;
  onClose: () => void;
  onCompletePin: (pin: string) => void;
}

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function normalizeSingleDigit(val: string): string {
  if (!val) return '';
  const ch = val.slice(-1);
  const idx = ARABIC_INDIC.indexOf(ch);
  if (idx !== -1) return String(idx);
  return /\d/.test(ch) ? ch : '';
}

function PinBoxesGroup({
  isSubmitting,
  hasErrorShake,
  onClose,
  onCompletePin,
}: {
  isSubmitting: boolean;
  hasErrorShake: boolean;
  onClose: () => void;
  onCompletePin: (pin: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);

  useEffect(() => {
    const t = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, []);

  const handleDigitChange = (index: number, rawValue: string) => {
    if (isSubmitting) return;
    const digit = normalizeSingleDigit(rawValue);

    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && next.every((d) => d.length === 1)) {
      onCompletePin(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isSubmitting) return;
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (isSubmitting) return;
    const pasted = e.clipboardData.getData('text').trim();
    const converted = pasted
      .split('')
      .map((c) => normalizeSingleDigit(c))
      .filter(Boolean)
      .slice(0, 4);

    if (converted.length > 0) {
      e.preventDefault();
      const next = ['', '', '', ''];
      converted.forEach((d, idx) => {
        next[idx] = d;
      });
      setDigits(next);
      if (converted.length === 4) {
        onCompletePin(next.join(''));
      } else {
        inputRefs.current[converted.length]?.focus();
      }
    }
  };

  return (
    <div
      dir="ltr"
      onPaste={handlePaste}
      className={`flex items-center justify-center gap-3 mb-6 ${
        hasErrorShake ? 'animate-loyalty-shake' : ''
      }`}
    >
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={isSubmitting}
          value={digit}
          onChange={(e) => handleDigitChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          aria-label={`الرقم ${idx + 1}`}
          className="w-15 h-16 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-center font-mono text-2xl font-black text-slate-900 shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-600/15 transition"
        />
      ))}
    </div>
  );
}

/**
 * Screen S03 — Cashier PIN Verification Bottom Sheet
 */
export default function PinBottomSheet({
  open,
  mode,
  primaryColor,
  isSubmitting,
  errorMsg,
  shakeKey,
  onClose,
  onCompletePin,
}: PinBottomSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      dir="rtl"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-[430px] bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-8 shadow-2xl border border-slate-100 animate-loyalty-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-8" />
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="إغلاق"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl text-white shadow-md"
            style={{ backgroundColor: mode === 'redeem' ? '#d97706' : primaryColor }}
          >
            {mode === 'redeem' ? '🎁' : '🏷️'}
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">
            {mode === 'redeem'
              ? 'كود الكاشير لتسليم الوجبة المجانية'
              : 'أدخل كود الكاشير اليومي (4 أرقام)'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {mode === 'redeem'
              ? 'اطلب من الكاشير إدخال كود اليوم لتأكيد صرف الهدية فوراً'
              : 'اسأل الكاشير أو شوف الكود المطبوع على الكاونتر'}
          </p>
        </div>

        {errorMsg && (
          <div
            key={`err-${shakeKey}`}
            className="p-3.5 mb-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold text-center animate-loyalty-shake"
          >
            {errorMsg}
          </div>
        )}

        <PinBoxesGroup
          key={`pin-boxes-${shakeKey}`}
          isSubmitting={isSubmitting}
          hasErrorShake={shakeKey > 0 && Boolean(errorMsg)}
          onClose={onClose}
          onCompletePin={onCompletePin}
        />

        <div className="min-h-[48px] flex items-center justify-center">
          {isSubmitting ? (
            <div className="inline-flex items-center gap-2.5 text-sm font-extrabold text-blue-700 bg-blue-50 px-5 py-3 rounded-2xl w-full justify-center">
              <span className="w-4 h-4 border-2 border-blue-700/30 border-t-blue-700 rounded-full animate-spin" />
              <span>جاري التحقق وتسجيل العملية...</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 font-semibold text-center">
              يتم التأكيد تلقائياً بمجرد كتابة الرقم الرابع ⚡
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
