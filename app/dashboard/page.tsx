import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseEnv } from '@/lib/env';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import UnifiedClientDashboard from '@/components/dashboard/UnifiedClientDashboard';
import { BusinessCard, Card, CardLead, CardWithDetails, Company } from '@/types/smart-cards';

export const dynamic = 'force-dynamic';

async function enrichCardsList(rawCards: Card[]): Promise<CardWithDetails[]> {
  if (!rawCards || rawCards.length === 0) return [];

  const cardIds = rawCards.map((c) => c.id);

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

  const scanCountByCardId = new Map<string, number>();
  for (const s of scans || []) {
    scanCountByCardId.set(s.card_id, (scanCountByCardId.get(s.card_id) || 0) + 1);
  }

  return rawCards.map((card) => {
    const bc = bcByCardId.get(card.id) || null;
    return {
      ...card,
      business_card: bc,
      scan_count: scanCountByCardId.get(card.id) || 0,
      leads: bc ? leadsByBcId.get(bc.id) || [] : [],
    };
  });
}

export default async function UnifiedDashboardPage() {
  const env = getServerSupabaseEnv();
  if (!env.isAuthConfigured) {
    redirect('/auth/login?redirect=/dashboard');
  }

  let user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null =
    null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (authErr) {
    console.error('UnifiedDashboardPage auth error:', authErr);
  }

  if (!user || !user.email) {
    redirect('/auth/login?redirect=/dashboard');
  }

  const isSuperAdmin = isSuperAdminEmail(user.email);
  const defaultDisplayName =
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';

  let personalCards: CardWithDetails[] = [];
  let companies: Company[] = [];
  let fleetCards: CardWithDetails[] = [];
  let loyaltyProgram: { business_name?: string } | null = null;
  let dataLoadError = false;

  try {
    const { data: personalRawCards } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    personalCards = await enrichCardsList((personalRawCards || []) as Card[]);

    // Only Super Admin or authorized Company Managers (matched by admin-created companies.contact_email) get Fleet capabilities
    let companiesQuery = supabaseAdmin
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isSuperAdmin) {
      companiesQuery = companiesQuery.ilike('contact_email', user.email.trim());
    }

    const { data: userCompaniesData } = await companiesQuery;
    companies = (userCompaniesData || []) as Company[];

    const companyBatchNames = Array.from(
      new Set(companies.map((c) => c.batch_name).filter(Boolean))
    ) as string[];

    if (companyBatchNames.length > 0) {
      const { data: fleetRaw } = await supabaseAdmin
        .from('cards')
        .select('*')
        .in('batch_name', companyBatchNames)
        .order('created_at', { ascending: false });

      fleetCards = await enrichCardsList((fleetRaw || []) as Card[]);
    }

    // Only show Loyalty link if user actually owns an active loyalty_programs row (or is Super Admin)
    const { data: lp } = await supabaseAdmin
      .from('loyalty_programs')
      .select('business_name')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    loyaltyProgram = lp || null;
  } catch (err) {
    console.error('UnifiedDashboardPage data error:', err);
    dataLoadError = true;
  }

  if (dataLoadError) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-950 mb-2">تعذر تحميل بيانات اللوحة</h1>
          <p className="text-sm text-neutral-600 mb-6">
            تأكد من إعداد متغير SUPABASE_SERVICE_ROLE_KEY في إعدادات البيئة ثم أعد المحاولة.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 bg-[#181818] text-white font-semibold rounded-xl text-sm"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <UnifiedClientDashboard
      cards={personalCards}
      companies={companies}
      fleetCards={fleetCards}
      loyaltyProgram={loyaltyProgram}
      userEmail={user.email}
      defaultDisplayName={defaultDisplayName}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
