import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-lg border border-slate-200/80 p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          🎁
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">منصة ولاء المطاعم الذكية (NFC / QR)</h1>
        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
          نظام ولاء العملاء السريع بدون تطبيقات. اجمع زياراتك واحصل على وجبتك السادسة مجاناً!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard/loyalty"
            className="py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm transition text-sm text-center"
          >
            لوحة تحكم التاجر / الكاشير 💼
          </Link>
          <Link
            href="/l/test-cafe"
            className="py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-sm transition text-sm text-center"
          >
            تجربة كارت العميل (Test Cafe) 🏷️
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
          متوافق مع قانون حماية البيانات المصري • تصميم عالي الأداء ومتوافق مع الموبايل
        </div>
      </div>
    </div>
  );
}
