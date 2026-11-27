import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import ActivateCardClient from '@/components/cards/ActivateCardClient';
import { Card } from '@/types/smart-cards';

interface PageProps {
  params: Promise<{ code: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ActivateCardPage({ params }: PageProps) {
  const { code } = await params;

  if (!code) {
    notFound();
  }

  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();

  // Fetch card using supabaseAdmin to bypass RLS restrictions for unclaimed lookup
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
          <h1 className="text-xl font-bold text-slate-900 mb-2">الكارت غير موجود في النظام</h1>
          <p className="text-sm text-slate-600 mb-6">
            الكود ({normalizedCode}) غير مسجل في قاعدة البيانات. تأكد من صحة الكود أو تواصل مع الدعم الفني.
          </p>
        </div>
      </div>
    );
  }

  if (card.status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⛔
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">الكارت موقوف</h1>
          <p className="text-sm text-slate-600 mb-6">هذا الكارت تم إيقافه.</p>
        </div>
      </div>
    );
  }

  return <ActivateCardClient card={card as Card} code={normalizedCode} />;
}
