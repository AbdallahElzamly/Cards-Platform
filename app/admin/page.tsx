import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSupabaseEnv } from '@/lib/env';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import { getAdminDashboardData } from '@/app/actions/admin';
import AdminBatchDashboard from '@/components/admin/AdminBatchDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const env = getServerSupabaseEnv();
  if (!env.isAuthConfigured) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-950 mb-2">إعدادات البيئة غير مكتملة</h1>
          <p className="text-sm text-neutral-600">تأكد من ضبط مفاتيح Supabase على Vercel.</p>
        </div>
      </div>
    );
  }

  let userEmail: string | null = null;
  let loadFailed = false;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email || null;
  } catch (err) {
    console.error('AdminPage auth error:', err);
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-950 mb-2">تعذر تحميل لوحة المشرف</h1>
          <p className="text-sm text-neutral-600">تأكد من ضبط SUPABASE_SERVICE_ROLE_KEY ثم حاول مجدداً.</p>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-950 mb-2">تسجيل دخول المشرف</h1>
          <p className="text-sm text-neutral-600 mb-6">
            يرجى تسجيل الدخول بحساب مشرف المنصة للوصول إلى مركز التجهيز والإدارة.
          </p>
          <Link
            href="/auth/login?redirect=/admin"
            className="inline-flex min-h-[46px] items-center justify-center px-6 py-3 bg-[#181818] text-white font-semibold rounded-xl text-sm"
          >
            تسجيل الدخول الآن
          </Link>
        </div>
      </div>
    );
  }

  if (!isSuperAdminEmail(userEmail)) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-950 mb-2">حساب غير مضاف كمشرف عام</h1>
          <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
            أنت مسجل حالياً بالبريد (<span className="font-mono">{userEmail}</span>). لإدارة كروتك أو شركتك اذهب للوحة التحكم، أو أضف هذا البريد في متغير{' '}
            <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded">ADMIN_EMAILS</code> على Vercel.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[46px] items-center justify-center px-6 py-3 bg-[#181818] text-white font-semibold rounded-xl text-sm"
          >
            الانتقال إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  const dashboardData = await getAdminDashboardData();

  return (
    <AdminBatchDashboard
      cards={dashboardData.cards}
      batches={dashboardData.batches}
      companies={dashboardData.companies}
    />
  );
}
