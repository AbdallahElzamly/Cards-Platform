'use client';

import { useEffect } from 'react';

export default function LoyaltyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Loyalty page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ⚠️
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">المطعم غير متاح حالياً أو الاتصال ضعيف</h1>
        <p className="text-sm text-slate-600 mb-6">
          حدث خطأ مؤقت أثناء تحميل صفحة الولاء. يرجى المحاولة مرة أخرى.
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-sm"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
