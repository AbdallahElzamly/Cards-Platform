'use client';

import React from 'react';
import Link from 'next/link';

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 text-center flex flex-col gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-bold text-xl mx-auto flex items-center justify-center">
          !
        </div>
        <h1 className="text-lg font-bold text-neutral-950">حدث خطأ مؤقت أثناء تحميل لوحة التحكم</h1>
        <p className="text-xs text-neutral-600 leading-relaxed">
          بياناتك آمنة ولم تُفقد. يمكنك إعادة المحاولة الآن أو العودة لصفحة لوحة التحكم.
        </p>
        {error?.digest && (
          <p className="text-[11px] font-mono text-neutral-400">Ref: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 min-h-[44px] px-5 py-2.5 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs cursor-pointer"
          >
            إعادة المحاولة الآن
          </button>
          <Link
            href="/dashboard"
            className="flex-1 min-h-[44px] px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold rounded-xl text-xs flex items-center justify-center"
          >
            تحديث اللوحة
          </Link>
        </div>
      </div>
    </div>
  );
}
