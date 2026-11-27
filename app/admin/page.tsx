import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getAdminDashboardData } from '@/app/actions/admin';
import AdminBatchDashboard from '@/components/admin/AdminBatchDashboard';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

export default async function AdminPage() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <h1 className="text-xl font-bold text-slate-900 mb-2">يرجى تسجيل الدخول</h1>
            <p className="text-sm text-slate-600 mb-6">يجب تسجيل الدخول بحساب مشرف النظام للوصول إلى هذه الصفحة.</p>
            <a
              href="/auth/login?redirect=/admin"
              className="inline-block py-3 px-6 bg-blue-600 text-white font-bold rounded-xl text-xs"
            >
              تسجيل الدخول
            </a>
          </div>
        </div>
      );
    }

    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv
      ? adminEmailsEnv.split(',').map((e) => e.trim().toLowerCase())
      : ['admin@kuwi.com', 'admin@cards-platform.local'];

    const isAdmin = adminEmails.includes(user.email.toLowerCase());

    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ⛔
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">غير مصرح بالدخول</h1>
            <p className="text-sm text-slate-600 mb-6">حسابك ({user.email}) ليس لديه صلاحيات مشرف النظام (Admin).</p>
            <a
              href="/dashboard"
              className="inline-block py-3 px-6 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              الذهاب للوحة التحكم العادية
            </a>
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
  } catch (err) {
    console.error('AdminPage error:', err);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
          <h1 className="text-xl font-bold text-slate-900 mb-2">تعذر تحميل صفحة المشرف</h1>
          <p className="text-sm text-slate-600">يرجى المحاولة لاحقاً.</p>
        </div>
      </div>
    );
  }
}
