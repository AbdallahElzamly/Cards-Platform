import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { BusinessCard } from '@/types/smart-cards';
import SmartBusinessCardClient from '@/components/cards/SmartBusinessCardClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function BusinessCardPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  // 1. Fetch business card by slug
  const { data: card, error } = await supabaseAdmin
    .from('business_cards')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !card || !card.is_active) {
    notFound();
  }

  // Record scan on parent card if available
  if (card.card_id) {
    try {
      await supabaseAdmin.from('scans').insert({
        card_id: card.card_id,
        device_type: 'mobile',
      });
    } catch (err) {
      console.error('Scan insert error:', err);
    }
  }

  return <SmartBusinessCardClient card={card as BusinessCard} />;
}
