import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { recordCardScan } from '@/lib/record-scan';

interface PageProps {
  params: Promise<{ code: string }>;
}

export const dynamic = 'force-dynamic';

export default async function DynamicGatewayPage({ params }: PageProps) {
  const { code } = await params;

  if (!code) {
    notFound();
  }

  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();

  // 1. Look up code in cards table using exact uppercase normalized code
  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('code', normalizedCode)
    .single();

  if (error || !card) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🔍
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">الكارت غير موجود</h1>
          <p className="text-sm text-slate-600 mb-6">
            عذراً، هذا الكارت ({normalizedCode}) غير مسجل في النظام أو تم إيقافه.
          </p>
        </div>
      </div>
    );
  }

  // Record scan (bot-filtered & rate-limited, best effort)
  await recordCardScan(card.id);

  // 2. If suspended
  if (card.status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⛔
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">الكارت موقوف مؤقتاً</h1>
          <p className="text-sm text-slate-600 mb-6">
            هذا الكارت تم تعليقه من قبل الإدارة أو صاحب الحساب.
          </p>
        </div>
      </div>
    );
  }

  // 3. If lost / recovery mode
  if (card.status === 'lost') {
    if (card.product === 'business') {
      const { data: businessCard } = await supabaseAdmin
        .from('business_cards')
        .select('slug')
        .eq('card_id', card.id)
        .single();

      if (businessCard?.slug) {
        redirect(`/c/${businessCard.slug}?lost=true`);
      }
    }

    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl shadow-2xl p-8 text-center border border-amber-500/30">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold mb-2">تنبيه: هذا الكارت مفقود / مبلغ عن فقدانه</h1>
          <p className="text-sm text-slate-300 mb-6">
            إذا عثرت على هذه البطاقة، يرجى التواصل مع مالكها أو تسليمها للإدارة المختصة.
          </p>
        </div>
      </div>
    );
  }

  // 4. If unclaimed -> redirect to activation
  if (card.status === 'unclaimed') {
    redirect(`/activate/${encodeURIComponent(card.code)}`);
  }

  // 5. If active -> route based on product type
  if (card.product === 'review') {
    const targetUrl = card.target_url && /^https?:\/\//i.test(card.target_url) ? card.target_url : '/';
    redirect(targetUrl);
  }

  if (card.product === 'business') {
    const { data: businessCard } = await supabaseAdmin
      .from('business_cards')
      .select('slug')
      .eq('card_id', card.id)
      .maybeSingle();

    if (businessCard?.slug) {
      redirect(`/c/${businessCard.slug}`);
    }
    redirect(`/activate/${encodeURIComponent(card.code)}`);
  }

  if (card.product === 'loyalty') {
    const { data: loyaltyProg } = await supabaseAdmin
      .from('loyalty_programs')
      .select('slug')
      .eq('owner_id', card.owner_id)
      .single();

    if (loyaltyProg?.slug) {
      redirect(`/l/${loyaltyProg.slug}`);
    }
  }

  // Fallback if target entity missing
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">الكارت غير مرتبط بصفحة نشطة</h1>
        <p className="text-sm text-slate-600">يرجى التواصل مع الدعم الفني أو صاحب الكارت.</p>
      </div>
    </div>
  );
}
