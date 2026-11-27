'use client';

import React, { useState, useTransition } from 'react';
import { BusinessCard } from '@/types/smart-cards';
import { submitCardLeadAction } from '@/app/actions/leads';
import { useSearchParams } from 'next/navigation';

interface SmartBusinessCardClientProps {
  card: BusinessCard;
}

function getWhatsAppUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let cleaned = raw.replace(/\D/g, '');
  if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '200' + cleaned.substring(1);
  }
  if (cleaned.length < 10) return null;
  return `https://wa.me/${cleaned}`;
}

export default function SmartBusinessCardClient({ card }: SmartBusinessCardClientProps) {
  const searchParams = useSearchParams();
  const isLost = searchParams.get('lost') === 'true';

  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorNote, setVisitorNote] = useState('');
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedVodafone, setCopiedVodafone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleFields = (card.social_links as any)?.visible_fields || {};
  const isFieldVisible = (key: string) => visibleFields[key] !== false;

  const whatsappUrl = getWhatsAppUrl(card.whatsapp);

  const handleLeadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!visitorName.trim() || !visitorPhone.trim()) return;

    const formData = new FormData(e.currentTarget);
    formData.set('business_card_id', card.id);
    formData.set('visitor_name', visitorName);
    formData.set('visitor_phone', visitorPhone);
    formData.set('visitor_note', visitorNote);

    startTransition(async () => {
      const res = await submitCardLeadAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل إرسال البيانات');
      } else {
        setLeadSuccess(true);
        setVisitorName('');
        setVisitorPhone('');
        setVisitorNote('');
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVodafone(true);
    setTimeout(() => setCopiedVodafone(false), 2000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans antialiased"
      style={{
        background: `linear-gradient(135deg, ${card.theme_color || '#0F172A'} 0%, #1e293b 100%)`,
      }}
      dir="rtl"
    >
      <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-2xl shadow-black/30 overflow-hidden border border-white/30 p-6 sm:p-8 flex flex-col gap-6 transition-all">
        
        {isLost && (
          <div className="p-3.5 bg-amber-400 text-slate-950 font-black rounded-2xl text-xs text-center shadow-md animate-pulse border border-amber-500">
            ⚠️ تنبيه: هذا الكارت مبلغ عن فقدانه. إذا عثرت عليه يرجى الاتصال بصاحبه أدناه.
          </div>
        )}

        {/* Profile Header */}
        <div className="text-center relative flex flex-col items-center pt-2">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-3xl font-black text-slate-800 mb-4 ring-2 ring-slate-900/10">
            {card.avatar_url && !imageError ? (
              <img
                src={card.avatar_url}
                alt={card.full_name}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{card.full_name ? card.full_name.charAt(0) : 'K'}</span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
            {card.full_name}
          </h1>

          {card.job_title && (
            <p className="text-xs font-bold text-blue-600 tracking-wide uppercase mb-0.5">
              {card.job_title}
            </p>
          )}

          {card.company && (
            <p className="text-xs font-medium text-slate-500">
              {card.company}
            </p>
          )}

          {card.bio && isFieldVisible('bio') && (
            <p className="text-xs text-slate-600 mt-3 px-3 leading-relaxed bg-slate-50/90 py-3 rounded-2xl border border-slate-100 w-full text-center">
              {card.bio}
            </p>
          )}
        </div>

        {/* Primary Contact Actions */}
        <div className="grid grid-cols-2 gap-3">
          {card.phone && isFieldVisible('phone') && (
            <a
              href={`tel:${card.phone}`}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-2xl text-xs text-center transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <span>📞 اتصال مباشر</span>
            </a>
          )}
          {whatsappUrl && isFieldVisible('whatsapp') && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-2xl text-xs text-center transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <span>💬 واتساب</span>
            </a>
          )}
        </div>

        {/* Save Contact (.vcf) */}
        <a
          href={`/api/vcard/${card.slug}`}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold rounded-2xl text-xs text-center transition-all shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2"
        >
          <span>📥 حفظ جهة الاتصال (.vcf)</span>
        </a>

        {/* Secondary Info & Payment Links */}
        <div className="flex flex-col gap-2.5">
          {card.email && isFieldVisible('email') && (
            <a
              href={`mailto:${card.email}`}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100/80 text-xs text-slate-700 flex items-center justify-between transition-all"
            >
              <span className="font-semibold text-slate-800">البريد الإلكتروني</span>
              <span className="font-mono text-slate-500">{card.email}</span>
            </a>
          )}
          {card.website && isFieldVisible('website') && (
            <a
              href={card.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100/80 text-xs text-slate-700 flex items-center justify-between transition-all"
            >
              <span className="font-semibold text-slate-800">الموقع الإلكتروني</span>
              <span className="font-mono text-blue-600 font-bold">زيارة الموقع ↗</span>
            </a>
          )}
          {card.vodafone_cash && isFieldVisible('vodafone_cash') && (
            <div className="p-3.5 bg-red-50/70 rounded-2xl border border-red-100/80 text-xs text-slate-700 flex items-center justify-between">
              <span className="font-semibold text-red-900">فودافون كاش</span>
              <button
                onClick={() => copyToClipboard(card.vodafone_cash || '')}
                className="font-mono text-red-600 font-bold hover:underline bg-white px-3 py-1.5 rounded-xl shadow-xs"
              >
                {copiedVodafone ? 'تم النسخ ✓' : card.vodafone_cash}
              </button>
            </div>
          )}
          {card.instapay_url && isFieldVisible('instapay') && (
            <a
              href={card.instapay_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 bg-purple-50/70 hover:bg-purple-100/70 rounded-2xl border border-purple-100/80 text-xs text-purple-900 flex items-center justify-between transition-all font-semibold"
            >
              <span>انستاباي (InstaPay)</span>
              <span>تحويل سريع ↗</span>
            </a>
          )}
        </div>

        {/* Lead Capture Form: شارك بياناتك معي */}
        <div className="bg-slate-50/90 p-5 rounded-3xl border border-slate-200/60 shadow-inner">
          <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <span>📇</span>
            <span>شارك بياناتك معي</span>
          </h3>
          
          {errorMsg && (
            <div className="p-2.5 mb-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {leadSuccess ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200">
              تم إرسال بياناتك بنجاح! شكراً لك.
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                name="visitor_name"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="اسمك الكريم"
                className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
              <input
                type="tel"
                name="visitor_phone"
                required
                dir="ltr"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="رقم الموبايل"
                className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition text-right font-mono"
              />
              <input
                type="text"
                name="visitor_note"
                value={visitorNote}
                onChange={(e) => setVisitorNote(e.target.value)}
                placeholder="ملاحظة أو طلب (اختياري)"
                className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold rounded-xl text-xs transition-all shadow-sm"
              >
                {isPending ? 'جاري الإرسال...' : 'إرسال بياناتي'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
