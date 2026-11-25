import Link from 'next/link';

export default function LoyaltyNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🔍
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">عذراً، صفحة الولاء غير موجودة</h1>
        <p className="text-sm text-slate-600 mb-6">
          تأكد من صحة الرابط أو أن المطعم مفعل لبرنامج الولاء حالياً.
        </p>
        <Link
          href="/"
          className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-sm text-center"
        >
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
