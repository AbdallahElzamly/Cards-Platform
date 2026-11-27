import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase-admin';
import UnifiedClientDashboard from '@/components/dashboard/UnifiedClientDashboard';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

export default async function UnifiedDashboardPage() {
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
      redirect('/auth/login?redirect=/dashboard');
    }

    // 1. Fetch cards owned by user with graceful error handling
    let rawCards = [];
    try {
      const { data } = await supabaseAdmin
        .from('cards')
        .select('*')
        .eq('owner_id', user.id);
      rawCards = data || [];
    } catch (e) {
      console.error('Failed to fetch cards:', e);
    }

    const cardsWithDetails = await Promise.all(
      rawCards.map(async (card: any) => {
        let business_card = null;
        let leads = [];

        try {
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
        } catch (err) {
          console.error('Failed to fetch card details:', err);
        }

        let scan_count = 0;
        try {
          const { count } = await supabaseAdmin
            .from('scans')
            .select('*', { count: 'exact', head: true })
            .eq('card_id', card.id);
          scan_count = count || 0;
        } catch (err) {
          console.error('Failed to fetch scans:', err);
        }

        return {
          ...card,
          business_card,
          scan_count,
          leads,
        };
      })
    );

    // 2. Fetch loyalty program owned by user
    let loyaltyProgram = null;
    try {
      const { data: lp } = await supabaseAdmin
        .from('loyalty_programs')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      loyaltyProgram = lp;
    } catch (e) {
      // no loyalty program
    }

    return (
      <UnifiedClientDashboard
        cards={cardsWithDetails}
        loyaltyProgram={loyaltyProgram || null}
        userEmail={user.email}
      />
    );
  } catch (err) {
    console.error('UnifiedDashboardPage render error:', err);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">تعذر تحميل لوحة التحكم مؤقتاً</h1>
          <p className="text-sm text-slate-600 mb-6">يرجى التحقق من إعدادات قاعدة البيانات أو المحاولة لاحقاً.</p>
          <a
            href="/"
            className="inline-block py-3 px-6 bg-blue-600 text-white font-bold rounded-xl text-xs"
          >
            الرئيسية
          </a>
        </div>
      </div>
    );
  }
}
