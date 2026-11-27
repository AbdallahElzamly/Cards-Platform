import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-4xl w-full flex flex-col gap-8 text-center my-12">
        
        {/* Brand Hero */}
        <div>
          <span className="bg-blue-100 text-blue-700 font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            KUWI Platform • NFC & QR
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 mb-3 tracking-tight">
            منصة كوي الموحدة للبطاقات الذكية ونظام الولاء
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            الحل الأمثل لمشاركة بيانات عملك، جمع تقييمات جوجل، وبناء ولاء عملائك بلمسة واحدة عبر تقنية NFC.
          </p>
        </div>

        {/* Two Distinct Product Paths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
          
          {/* Path 1: Smart Cards & Reviews */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold">
                📇
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">كروت الأعمال الذكية وتقييمات جوجل</h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                شارك بيانات اتصالك، مواقع التواصل، روابط انستاباي وفودافون كاش فوري (.vcf)، أو وجه عملائك مباشرة لتقييم 5 نجوم على خرائط جوجل.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard"
                className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs text-center transition shadow-sm"
              >
                تسجيل الدخول للوحة التحكم 💼
              </Link>
            </div>
          </div>

          {/* Path 2: Restaurant Loyalty */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold">
                🎁
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">نظام ولاء المطاعم والكافيهات</h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                برنامج ولاء رقمي بدون تطبيقات (اجمع زياراتك.. والسادسة مجاناً). حماية ثلاثية ضد الاحتيال، كود كاشير يومي، وقسائم حية ومباشرة.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard/loyalty"
                className="py-3 px-5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs text-center transition shadow-sm"
              >
                إدارة برنامج الولاء 🎁
              </Link>
              <Link
                href="/l/test-cafe"
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs text-center transition"
              >
                تجربة كارت العميل 🏷️
              </Link>
            </div>
          </div>

        </div>

        <div className="text-xs text-slate-400 pt-4">
          KUWI NFC Platform • جميع الحقوق محفوظة © 2026
        </div>

      </div>
    </div>
  );
}
