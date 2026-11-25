import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getMemberCardState } from '@/app/actions/loyalty';
import CustomerLoyaltyCard from '@/components/loyalty/CustomerLoyaltyCard';
import { LoyaltyProgram } from '@/types/loyalty';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}

async function LoyaltyContent({ slug, tableCode }: { slug: string; tableCode?: string }) {
  const { data: rawProgram, error } = await supabaseAdmin
    .from('loyalty_programs')
    .select('id, slug, business_name, logo_url, primary_color, stamps_required, min_bill_egp, reward_title, reward_terms, cooldown_hours, is_active, v2_scratch_enabled, v2_double_stamp_active, created_at')
    .eq('slug', slug)
    .single();

  if (error || !rawProgram || !rawProgram.is_active) {
    notFound();
  }

  const program: LoyaltyProgram = {
    ...rawProgram,
    owner_id: '',
    daily_pin_hash: '',
    daily_pin_display: '',
    pin_rotated_at: '',
  };

  const cardState = await getMemberCardState(slug);

  return (
    <CustomerLoyaltyCard
      slug={slug}
      program={program}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">جاري التحميل...</div>}>
      <LoyaltyContent slug={slug} tableCode={tableCode} />
    </Suspense>
  );
}
