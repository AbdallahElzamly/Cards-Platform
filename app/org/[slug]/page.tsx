import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import CompanyPortalClient from '@/components/company/CompanyPortalClient';
import { Company, Card } from '@/types/smart-cards';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CompanyPortalPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  // 1. Fetch company by slug
  const { data: company, error: coErr } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (coErr || !company) {
    notFound();
  }

  // 2. Fetch cards belonging to company's batch_name (or all if batch_name is null)
  let cardsQuery = supabaseAdmin.from('cards').select('*');
  if (company.batch_name) {
    cardsQuery = cardsQuery.eq('batch_name', company.batch_name);
  }

  const { data: rawCards } = await cardsQuery;
  const cards = rawCards || [];

  // 3. Enrich cards with business_card, scan count, and leads
  const cardsWithDetails = await Promise.all(
    cards.map(async (card: any) => {
      let business_card = null;
      let leads = [];

      const { data: bc } = await supabaseAdmin
        .from('business_cards')
        .select('*')
        .eq('card_id', card.id)
        .single();
      business_card = bc;

      if (bc) {
        const { data: lds } = await supabaseAdmin
          .from('card_leads')
          .select('*')
          .eq('business_card_id', bc.id)
          .order('created_at', { ascending: false });
        leads = lds || [];
      }

      const { count: scan_count } = await supabaseAdmin
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', card.id);

      return {
        ...card,
        business_card,
        scan_count: scan_count || 0,
        leads,
      };
    })
  );

  return <CompanyPortalClient company={company as Company} cards={cardsWithDetails} />;
}
