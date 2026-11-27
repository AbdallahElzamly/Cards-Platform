import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
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

  const { data: company, error: coErr } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (coErr || !company) {
    notFound();
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
