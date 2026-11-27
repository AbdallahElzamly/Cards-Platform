'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card } from '@/types/smart-cards';

interface ActivateCardClientProps {
  card: Card;
  code: string;
}

export default function ActivateCardClient({ card, code }: ActivateCardClientProps) {
  const router = useRouter();

  const [productType, setProductType] = useState<'business' | 'review'>(card.product === 'review' ? 'review' : 'business');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [targetUrl, setTargetUrl] = useState(card.target_url || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key'
  );

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push(`/auth/login?redirect=/activate/${encodeURIComponent(code)}`);
          return;
        }

        if (card.status === 'active' && card.owner_id && card.owner_id !== user.id) {
          setErrorMsg('هذا الكارت مسجل بالفعل لمستخدم آخر');
          return;
        }

        // 1. Update card status & owner via Supabase browser client (respecting RLS or admin/update policies)
        const { error: updateCardErr } = await supabase
          .from('cards')
          .update({
            owner_id: user.id,
            status: 'active',
            product: productType,
            target_url: productType === 'review' ? targetUrl : null,
          })
          .eq('id', card.id);

        if (updateCardErr) throw updateCardErr;

        // 2. If business, create business_card record if not exists
        let cardSlug = '';
        if (productType === 'business') {
          cardSlug = (fullName.trim() ? fullName : 'card')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

          const { error: bcErr } = await supabase.from('business_cards').insert({
            card_id: card.id,
            slug: cardSlug,
            full_name: fullName || 'صاحب الكارت',
            job_title: jobTitle,
            company,
            phone,
            whatsapp,
            email,
          });

          if (bcErr) {
            // If already exists, fetch slug
            const { data: existingBc } = await supabase
              .from('business_cards')
              .select('slug')
              .eq('card_id', card.id)
              .single();
            if (existingBc?.slug) {
              cardSlug = existingBc.slug;
            }
          }
        }

        // Success redirect
        if (productType === 'business' && cardSlug) {
          router.push(`/c/${cardSlug}`);
        } else {
          router.push('/dashboard');
        }
      } catch (err: any) {
        console.error('Activation error:', err);
        setErrorMsg(err.message || 'حدث خطأ أثناء تفعيل الكارت');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
            ⚡
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">تفعيل الكارت الذكي</h1>
          <p className="text-xs text-slate-500 font-mono">
            الكود: {code}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleActivate} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الكارت</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
            >
              <option value="business">كارت أعمال ذكي (Smart Business Card)</option>
              <option value="review">كارت تقييم جوجل (Google Review Card)</option>
            </select>
          </div>

          {productType === 'business' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">المسمى الوظيفي</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="مدير مبيعات"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الشركة / النشاط</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="شركة التقنية المتقدمة"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الموبايل</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none text-right font-mono"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط تقييم جوجل (Google Maps Review URL)</label>
              <input
                type="url"
                required
                dir="ltr"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://g.page/r/..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none text-right font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition text-sm mt-2"
          >
            {isPending ? 'جاري التفعيل...' : 'تفعيل وربط الكارت 🚀'}
          </button>
        </form>

      </div>
    </div>
  );
}
