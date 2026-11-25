import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getMemberCardState } from '@/app/actions/loyalty';
import CustomerLoyaltyCard from '@/components/loyalty/CustomerLoyaltyCard';
import { PublicLoyaltyProgram } from '@/types/loyalty';

export const dynamic = 'force-dynamic';

const SAFE_PUBLIC_COLUMNS =
  'id, slug, business_name, logo_url, primary_color, stamps_required, min_bill_egp, reward_title, reward_terms, cooldown_hours, is_active, v2_scratch_enabled, v2_double_stamp_active, created_at';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}

function ServiceUnavailableFallback({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-200/80 p-8 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          📡
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">
          المطعم غير متاح حالياً أو الاتصال ضعيف
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          يرجى التأكد من اتصالك بالإنترنت أو إبلاغ الكاشير لتفعيل برنامج الولاء ثم المحاولة مرة أخرى.
        </p>
        <Link
          href={`/l/${encodeURIComponent(slug)}`}
          className="inline-block w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition shadow-sm text-sm"
        >
          إعادة المحاولة
        </Link>
      </div>
    </div>
  );
}

async function LoyaltyContent({ slug, tableCode }: { slug: string; tableCode?: string }) {
  let rawProgram: PublicLoyaltyProgram | null = null;
  let dbUnavailable = false;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('loyalty_programs')
      .select(SAFE_PUBLIC_COLUMNS)
      .eq('slug', slug.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('/l/[slug] program fetch error:', error);
      dbUnavailable = true;
    } else {
      rawProgram = data as PublicLoyaltyProgram | null;
    }
  } catch (err) {
    console.error('/l/[slug] unexpected error:', err);
    dbUnavailable = true;
  }

  if (dbUnavailable) {
    return <ServiceUnavailableFallback slug={slug} />;
  }

  if (!rawProgram || !rawProgram.is_active) {
    notFound();
  }

  const cardState = await getMemberCardState(rawProgram.slug);

  return (
    <CustomerLoyaltyCard
      slug={rawProgram.slug}
      program={rawProgram}
      initialMember={cardState.member || null}
      initialActiveVoucher={cardState.activeVoucher || null}
      initialCooldown={cardState.status === 'cooldown'}
      remainingHours={cardState.remainingHours || 0}
      remainingMinutes={cardState.remainingMinutes || 0}
      tableCode={tableCode}
    />
  );
}

export default async function LoyaltyCustomerPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { t: tableCode } = await searchParams;

  if (!slug) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 text-sm font-bold">
          جاري فتح كارت الولاء...
        </div>
      }
    >
      <LoyaltyContent slug={slug} tableCode={tableCode} />
    </Suspense>
  );
}
