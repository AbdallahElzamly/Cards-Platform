import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseEnv } from '@/lib/env';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import CompanyPortalClient from '@/components/company/CompanyPortalClient';
import { BusinessCard, Card, CardLead, CardWithDetails, Company } from '@/types/smart-cards';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CompanyPortalPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  // Enforce authenticated Company Admin or Super Admin access (Team 4 Security Fix)
  const env = getServerSupabaseEnv();
  if (!env.isAuthConfigured) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/org/${slug}`)}`);
  }

  let userEmail: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email || null;
  } catch {
    // handled below
  }

  if (!userEmail) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/org/${slug}`)}`);
  }

  const { data: company, error: coErr } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (coErr || !company) {
    notFound();
  }

  const isAuthorized =
    isSuperAdminEmail(userEmail) ||
    (Boolean(company.contact_email) &&
      company.contact_email.trim().toLowerCase() === userEmail.trim().toLowerCase());

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-950 mb-2">بوابة خاصة بإدارة الشركة</h1>
          <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
            يرجى تسجيل الدخول بالبريد الرسمي المعتمد لمسؤول شركة ({company.name}) للوصول إلى هذه البوابة.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 bg-[#181818] text-white font-semibold rounded-xl text-sm"
          >
            العودة للوحة بطاقتي الشخصية
          </Link>
        </div>
      </div>
    );
  }

  let cardsQuery = supabaseAdmin.from('cards').select('*').order('created_at', { ascending: false });
  if (company.batch_name) {
    cardsQuery = cardsQuery.eq('batch_name', company.batch_name);
  }

  const { data: rawCards } = await cardsQuery;
  const cards = rawCards || [];
  const cardIds = cards.map((c: { id: string }) => c.id);

  let cardsWithDetails: CardWithDetails[] = [];

  if (cardIds.length > 0) {
    const [{ data: businessCards }, { data: scans }] = await Promise.all([
      supabaseAdmin.from('business_cards').select('*').in('card_id', cardIds),
      supabaseAdmin.from('scans').select('card_id').in('card_id', cardIds),
    ]);

    const bcByCardId = new Map<string, BusinessCard>();
    const bcIds: string[] = [];
    for (const bc of businessCards || []) {
      bcByCardId.set(bc.card_id, bc as BusinessCard);
      bcIds.push(bc.id);
    }

    const leadsByBcId = new Map<string, CardLead[]>();
    if (bcIds.length > 0) {
      const { data: allLeads } = await supabaseAdmin
        .from('card_leads')
        .select('*')
        .in('business_card_id', bcIds)
        .order('created_at', { ascending: false });

      for (const lead of allLeads || []) {
        const arr = leadsByBcId.get(lead.business_card_id) || [];
        arr.push(lead as CardLead);
        leadsByBcId.set(lead.business_card_id, arr);
      }
    }

    const scanCounts = new Map<string, number>();
    for (const s of scans || []) {
      scanCounts.set(s.card_id, (scanCounts.get(s.card_id) || 0) + 1);
    }

    cardsWithDetails = (cards as Card[]).map((card) => {
      const bc = bcByCardId.get(card.id) || null;
      return {
        ...card,
        business_card: bc,
        scan_count: scanCounts.get(card.id) || 0,
        leads: bc ? leadsByBcId.get(bc.id) || [] : [],
      };
    });
  }

  return <CompanyPortalClient company={company as Company} cards={cardsWithDetails} />;
}
