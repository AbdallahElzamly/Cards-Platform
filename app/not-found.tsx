import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-[#181818] border border-white/10 rounded-3xl p-8 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-[#272727] border border-white/10 text-xs font-mono text-neutral-400 mb-4">
          404
        </span>
        <h1 className="text-2xl font-semibold text-white mb-2">الصفحة أو البطاقة غير موجودة</h1>
        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
          تأكد من صحة الرابط أو سجل الدخول إلى لوحة التحكم لإدارة بطاقاتك الذكية.
        </p>
        <div className="flex flex-col gap-2.5">
          <Link
            href="/"
            className="min-h-[46px] py-3 px-5 bg-white text-neutral-950 font-semibold rounded-xl text-sm flex items-center justify-center"
          >
            العودة للصفحة الرئيسية
          </Link>
          <Link
            href="/dashboard"
            className="min-h-[46px] py-3 px-5 bg-[#272727] text-white font-semibold rounded-xl text-sm flex items-center justify-center"
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
