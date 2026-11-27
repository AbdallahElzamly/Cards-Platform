import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

  // Record scan (best effort, non-blocking)
  try {
    await supabaseAdmin.from('scans').insert({
      card_id: card.id,
      device_type: 'mobile',
    });
  } catch (scanErr) {
    console.error('Failed to record scan:', scanErr);
  }

  // 3. If unclaimed -> redirect to activation
  if (card.status === 'unclaimed') {
    redirect(`/activate/${encodeURIComponent(card.code)}`);
  }

  // 4. If active -> route based on product type
  if (card.product === 'review') {
    const targetUrl = card.target_url && /^https?:\/\//i.test(card.target_url) ? card.target_url : '/';
    redirect(targetUrl);
  }

  if (card.product === 'business') {
    const { data: businessCard } = await supabaseAdmin
      .from('business_cards')
      .select('slug')
      .eq('card_id', card.id)
      .single();

    if (businessCard?.slug) {
      redirect(`/c/${businessCard.slug}`);
    }
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
