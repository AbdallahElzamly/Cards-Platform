import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';
import UnifiedClientDashboard from '@/components/dashboard/UnifiedClientDashboard';

export const dynamic = 'force-dynamic';

export default async function UnifiedDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    redirect('/auth/login?redirect=/dashboard');
  }

  // 1. Fetch cards owned by user
  const { data: rawCards } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('owner_id', user.id);

  const cards = rawCards || [];

  // 2. For each card, fetch business_card, scan count, and leads
  const cardsWithDetails = await Promise.all(
    cards.map(async (card: any) => {
      let business_card = null;
      let leads = [];

      if (card.product === 'business') {
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

  // 3. Fetch loyalty program owned by user
  const { data: loyaltyProgram } = await supabaseAdmin
    .from('loyalty_programs')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  return (
    <UnifiedClientDashboard
      cards={cardsWithDetails}
      loyaltyProgram={loyaltyProgram || null}
      userEmail={user.email}
    />
  );
}
