'use client';

import React, { useState, useTransition } from 'react';
import { BusinessCard } from '@/types/smart-cards';
import { submitCardLeadAction } from '@/app/actions/leads';

interface SmartBusinessCardClientProps {
  card: BusinessCard;
}

export default function SmartBusinessCardClient({ card }: SmartBusinessCardClientProps) {
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorNote, setVisitorNote] = useState('');
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedVodafone, setCopiedVodafone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPending, startTransition] = useTransition();

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
      className="min-h-screen flex items-center justify-center p-4 font-sans"
      style={{ backgroundColor: card.theme_color || '#0F172A' }}
      dir="rtl"
    >
      <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 flex flex-col gap-6">
        
        {/* Profile Header */}
        <div className="text-center relative">
          <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-2xl font-bold text-slate-700 mb-3">
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
          <h1 className="text-xl font-black text-slate-900 mb-1">{card.full_name}</h1>
          {card.job_title && <p className="text-xs font-semibold text-blue-600 mb-0.5">{card.job_title}</p>}
          {card.company && <p className="text-xs text-slate-500">{card.company}</p>}
          {card.bio && <p className="text-xs text-slate-600 mt-3 px-4 leading-relaxed">{card.bio}</p>}
        </div>

        {/* Primary Contact Actions */}
        <div className="grid grid-cols-2 gap-3">
          {card.phone && (
            <a
              href={`tel:${card.phone}`}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs text-center transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>📞 اتصال مباشر</span>
            </a>
          )}
          {card.whatsapp && (
            <a
              href={`https://wa.me/${card.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs text-center transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>💬 واتساب</span>
            </a>
          )}
        </div>

        {/* Save Contact (.vcf) */}
        <a
          href={`/api/vcard/${card.slug}`}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs text-center transition shadow-md flex items-center justify-center gap-2"
        >
          <span>📥 حفظ جهة الاتصال (.vcf)</span>
        </a>

        {/* Secondary Info & Payment Links */}
        <div className="flex flex-col gap-2.5">
          {card.email && (
            <a
              href={`mailto:${card.email}`}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 text-xs text-slate-700 flex items-center justify-between transition"
            >
              <span className="font-medium">البريد الإلكتروني</span>
              <span className="font-mono text-slate-500">{card.email}</span>
            </a>
          )}
          {card.website && (
            <a
              href={card.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 text-xs text-slate-700 flex items-center justify-between transition"
            >
              <span className="font-medium">الموقع الإلكتروني</span>
              <span className="font-mono text-blue-600">زيارة الموقع ↗</span>
            </a>
          )}
          {card.vodafone_cash && (
            <div className="p-3 bg-red-50/70 rounded-xl border border-red-100 text-xs text-slate-700 flex items-center justify-between">
              <span className="font-medium text-red-900">فودافون كاش</span>
              <button
                onClick={() => copyToClipboard(card.vodafone_cash || '')}
                className="font-mono text-red-600 font-bold hover:underline"
              >
                {copiedVodafone ? 'تم النسخ ✓' : card.vodafone_cash}
              </button>
            </div>
          )}
          {card.instapay_url && (
            <a
              href={card.instapay_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-purple-50/70 hover:bg-purple-100/70 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-center justify-between transition font-medium"
            >
              <span>انستاباي (InstaPay)</span>
              <span>تحويل ↗</span>
            </a>
          )}
        </div>

        {/* Lead Capture Form: شارك بياناتك معي */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-2">شارك بياناتك معي 📇</h3>
          
          {errorMsg && (
            <div className="p-2 mb-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {leadSuccess ? (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
              تم إرسال بياناتك بنجاح! شكراً لك.
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="flex flex-col gap-2.5">
              <input
                type="text"
                name="visitor_name"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="اسمك الكريم"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
              />
              <input
                type="tel"
                name="visitor_phone"
                required
                dir="ltr"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="رقم الموبايل"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none text-right font-mono"
              />
              <input
                type="text"
                name="visitor_note"
                value={visitorNote}
                onChange={(e) => setVisitorNote(e.target.value)}
                placeholder="ملاحظة أو طلب (اختياري)"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition shadow-sm"
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
