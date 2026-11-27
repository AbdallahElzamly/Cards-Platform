'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface ActivatePageProps {
  params: Promise<{ code: string }>;
}

export default function ActivateCardPage({ params }: ActivatePageProps) {
  const [resolvedParams, setResolvedParams] = React.useState<{ code: string } | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const [productType, setProductType] = useState<'business' | 'review'>('business');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedParams) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push(`/auth/login?redirect=/activate/${encodeURIComponent(resolvedParams.code)}`);
          return;
        }

        // 1. Find card
        const { data: card, error: cardError } = await supabase
          .from('cards')
          .select('*')
          .ilike('code', resolvedParams.code.trim())
          .single();

        if (cardError || !card) {
          setErrorMsg('الكارت غير موجود في النظام');
          return;
        }

        if (card.status === 'active' && card.owner_id && card.owner_id !== user.id) {
          setErrorMsg('هذا الكارت مسجل بالفعل لمستخدم آخر');
          return;
        }

        // 2. Update card status & owner
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

        // 3. If business, create business_card record
        let cardSlug = '';
        if (productType === 'business') {
          cardSlug = fullName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

          const { error: bcErr } = await supabase.from('business_cards').insert({
            card_id: card.id,
            slug: cardSlug,
            full_name: fullName,
            job_title: jobTitle,
            company,
            phone,
            whatsapp,
            email,
          });

          if (bcErr) throw bcErr;
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
            الكود: {resolvedParams?.code || '...'}
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
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
