import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMerchantLoyaltyDashboard } from '@/app/actions/loyalty-merchant';
import { merchantSignOutAction } from '@/app/actions/auth';
import MerchantLoyaltyDashboard from '@/components/loyalty/MerchantLoyaltyDashboard';

const SQL_QUICK_FIX = `GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_programs, public.loyalty_members, public.loyalty_visits, public.loyalty_vouchers TO authenticated;`;

export default async function MerchantDashboardView({
  businessId,
}: {
  businessId?: string;
}) {
  const result = await getMerchantLoyaltyDashboard(businessId);

  if (!result.success && result.reason === 'UNAUTHENTICATED') {
    const target = businessId
      ? `/dashboard/loyalty/${encodeURIComponent(businessId)}`
      : '/dashboard/loyalty';
    redirect(`/auth/login?redirect=${encodeURIComponent(target)}`);
  }

  if (!result.success && result.reason === 'NO_LOYALTY_PROGRAM') {
    redirect('/dashboard');
  }

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-7 sm:p-8">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-4">
            🛠️
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">
            خطوة تهيئة أخيرة مطلوبة لتشغيل قاعدة البيانات
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
            {result.error}
          </p>

          {result.reason === 'DB_PERMISSION_DENIED' && (
            <div className="mb-5">
              <p className="text-xs font-extrabold text-slate-800 mb-2">
                انسخ هذا الكود وشغّله مرة واحدة داخل Supabase Dashboard → SQL Editor → Run:
              </p>
              <pre
                dir="ltr"
                className="bg-slate-950 text-emerald-300 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed text-left"
              >
                {SQL_QUICK_FIX}
              </pre>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/loyalty"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition"
            >
              إعادة المحاولة بعد التفعيل 🔄
            </Link>
            <form action={merchantSignOutAction}>
              <button
                type="submit"
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <MerchantLoyaltyDashboard initialData={result.data} />;
}
