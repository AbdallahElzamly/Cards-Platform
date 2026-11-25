import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto w-full pt-6 sm:pt-12 pb-12">
        {/* Top Brand Pill */}
        <div className="flex items-center justify-between mb-10">
          <div className="inline-flex items-center gap-2.5 bg-white/10 border border-white/15 px-4 py-2 rounded-full backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-slate-100">
              Cards Platform • نظام ولاء المطاعم الذكي
            </span>
          </div>

          <Link
            href="/auth/login"
            className="text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition"
          >
            دخول التجار ←
          </Link>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/60 border border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-extrabold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3.5 py-1 rounded-full mb-4">
              بدون تحميل تطبيقات • بدون رسائل OTP مدفوعة • في 4 ثوانٍ فقط
            </span>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight mb-4">
              حوّل كل طاولة في مطعمك إلى{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500">
                كارت ولاء ذكي
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              يلمس العميل كارت الـ NFC أو يمسح الـ QR من طاولته، يسجل زيارته بكود الكاشير اليومي المتغير، وفي الزيارة السادسة تظهر له قسيمة الهدية الذهبية الحية المضادة للـ Screenshot.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5">
              <Link
                href="/dashboard/loyalty"
                className="py-4 px-7 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/25 transition text-sm sm:text-base text-center"
              >
                فتح لوحة تحكم التاجر والكاشير 💼
              </Link>
              <Link
                href="/l/test-cafe?t=3"
                className="py-4 px-7 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold rounded-2xl transition text-sm sm:text-base text-center"
              >
                معاينة كارت العميل التجريبي 🏷️
              </Link>
            </div>
          </div>

          {/* 3 Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/10">
            <div className="bg-black/25 border border-white/5 rounded-2xl p-4">
              <div className="text-xl mb-2">⚡</div>
              <h2 className="font-extrabold text-sm text-white mb-1">سرعة فائقة بلا تعقيد</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                أول زيارة في أقل من 12 ثانية، والزيارات التالية تُختم تلقائياً في أقل من 4 ثوانٍ عبر كوكي مشفرة لمدة عام.
              </p>
            </div>

            <div className="bg-black/25 border border-white/5 rounded-2xl p-4">
              <div className="text-xl mb-2">🛡️</div>
              <h2 className="font-extrabold text-sm text-white mb-1">درع ثلاثي ضد التلاعب</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                كود كاشير يومي متغير، فترة تهدئة زمنية من السيرفر، وقسيمة وجبة مجانية بساعة ثوانٍ حية وصرف ذري لمرة واحدة.
              </p>
            </div>

            <div className="bg-black/25 border border-white/5 rounded-2xl p-4">
              <div className="text-xl mb-2">🔒</div>
              <h2 className="font-extrabold text-sm text-white mb-1">خصوصية مشفرة 100%</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                تشفير أرقام الموبايل المصري عبر HMAC-SHA256 بما يتوافق مع قانون حماية البيانات رقم 151 لسنة 2020.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 pb-4">
        منصة كروت الولاء الذكية (NFC / Dynamic QR) • مصممة للعمل بأعلى سرعة على شبكات الموبايل
      </footer>
    </main>
  );
}
