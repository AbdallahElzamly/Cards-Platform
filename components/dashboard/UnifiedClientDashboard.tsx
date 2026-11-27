'use client';

import React, { useState, useTransition } from 'react';
import { Card, BusinessCard, CardStatus } from '@/types/smart-cards';
import {
  updateBusinessCardAction,
  updateReviewCardTargetUrlAction,
  updateCardStatusModeAction,
  reassignCardCustodyAction,
  transferCardOwnershipAction,
} from '@/app/actions/dashboard';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface CardWithDetails extends Card {
  business_card?: BusinessCard | null;
  scan_count?: number;
  leads?: Array<{
    id: string;
    visitor_name: string;
    visitor_phone: string;
    visitor_note: string | null;
    created_at: string;
  }>;
}

interface UnifiedClientDashboardProps {
  cards: CardWithDetails[];
  loyaltyProgram: any | null;
  userEmail: string;
}

export default function UnifiedClientDashboard({ cards, loyaltyProgram, userEmail }: UnifiedClientDashboardProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'cards' | 'leads' | 'custody'>('overview');
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(cards[0]?.business_card?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key'
  );

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];
  const initialVisibleFields = (selectedCard?.business_card?.social_links as any)?.visible_fields || {
    phone: true,
    whatsapp: true,
    email: true,
    website: true,
    vodafone_cash: true,
    instapay: true,
    bio: true,
  };
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(initialVisibleFields);

  const handleCardSelect = (id: string) => {
    setSelectedCardId(id);
    const found = cards.find((c) => c.id === id);
    setAvatarUrl(found?.business_card?.avatar_url || '');
    setVisibleFields((found?.business_card?.social_links as any)?.visible_fields || {
      phone: true,
      whatsapp: true,
      email: true,
      website: true,
      vodafone_cash: true,
      instapay: true,
      bio: true,
    });
  };

  const handleApplyPreset = (preset: 'all' | 'work' | 'social_pay') => {
    let updated: Record<string, boolean> = {};
    if (preset === 'all') {
      updated = { phone: true, whatsapp: true, email: true, website: true, vodafone_cash: true, instapay: true, bio: true };
    } else if (preset === 'work') {
      updated = { phone: true, whatsapp: true, email: true, website: true, vodafone_cash: false, instapay: false, bio: true };
    } else if (preset === 'social_pay') {
      updated = { phone: false, whatsapp: false, email: false, website: false, vodafone_cash: true, instapay: true, bio: false };
    }
    setVisibleFields(updated);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً (الحد الأقصى 3 ميجابايت)');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar-${selectedCard?.id || 'card'}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true,
      });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          setAvatarUrl(publicUrlData.publicUrl);
          setUploadingAvatar(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload fallback to base64:', err);
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setAvatarUrl(result);
      }
      setUploadingAvatar(false);
    };
    reader.onerror = () => {
      setUploadingAvatar(false);
      setErrorMsg('فشل قراءة ملف الصورة');
    };
    reader.readAsDataURL(file);
  };

  const handleToggleField = (fieldKey: string) => {
    setVisibleFields((prev) => ({
      ...prev,
      [fieldKey]: prev[fieldKey] === false ? true : false,
    }));
  };

  const handleBusinessSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    if (avatarUrl) {
      formData.set('avatar_url', avatarUrl);
    }

    const existingSocials = selectedCard.business_card?.social_links || {};
    const updatedSocials = {
      ...(typeof existingSocials === 'object' ? existingSocials : {}),
      visible_fields: visibleFields,
    };
    formData.set('social_links_json', JSON.stringify(updatedSocials));

    startTransition(async () => {
      const res = await updateBusinessCardAction(selectedCard.id, formData);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل التحديث');
      } else {
        setSuccessMsg('تم حفظ وتحديث الكارت وإعدادات الخصوصية بنجاح! ✅');
      }
    });
  };

  const handleStatusChange = (status: CardStatus) => {
    if (!selectedCard) return;
    startTransition(async () => {
      const res = await updateCardStatusModeAction(selectedCard.id, status);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل تغيير حالة الكارت');
      } else {
        setSuccessMsg(`تم تحديث حالة الكارت إلى (${status}) بنجاح!`);
      }
    });
  };

  const handleCustodyReassign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    if (!window.confirm('هل أنت متأكد من إعادة تعيين الكارت للموظف الجديد؟')) {
      return;
    }

    const formData = new FormData(e.currentTarget);
    const clearLeads = (formData.get('clear_leads') === 'on');
    if (avatarUrl) formData.set('avatar_url', avatarUrl);

    startTransition(async () => {
      const res = await reassignCardCustodyAction(selectedCard.id, formData, clearLeads);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل نقل عهدة الكارت');
      } else {
        setSuccessMsg('تم نقل عهدة الكارت وتحديث بيانات الموظف بنجاح! 🔄');
      }
    });
  };

  const handleTransferOwnership = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    if (!transferEmail.trim()) {
      setErrorMsg('يرجى إدخال بريد العميل الإلكتروني');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من نقل ملكية هذا الكارت إلى (${transferEmail})؟ لن يظهر الكارت في لوحتك بعد الآن.`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await transferCardOwnershipAction(selectedCard.id, transferEmail);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل نقل الملكية');
      } else {
        setSuccessMsg(`تم نقل ملكية الكارت إلى (${transferEmail}) بنجاح! 👑`);
        setTransferEmail('');
      }
    });
  };

  const handleReviewUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const targetUrl = formData.get('target_url')?.toString() || '';

    startTransition(async () => {
      const res = await updateReviewCardTargetUrlAction(selectedCard.id, targetUrl);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل تحديث الرابط');
      } else {
        setSuccessMsg('تم تحديث رابط التقييم بنجاح! ✅');
      }
    });
  };

  const handleExportLeads = (leads: any[]) => {
    const headers = ['visitor_name', 'visitor_phone', 'visitor_note', 'created_at'];
    const rows = leads.map((l) => [l.visitor_name, l.visitor_phone, l.visitor_note || '', l.created_at]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads-${selectedCard?.code || 'card'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalScans = cards.reduce((acc, c) => acc + (c.scan_count || 0), 0);
  const totalLeads = cards.reduce((acc, c) => acc + (c.leads?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased" dir="rtl">
      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* Right-Side Navigation Sidebar */}
        <aside className="w-full lg:w-72 bg-white border-l border-slate-200/80 p-6 flex flex-col justify-between shrink-0 shadow-sm">
          <div className="flex flex-col gap-6">
            
            {/* Brand Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  K
                </span>
                <span className="font-black text-lg tracking-tight text-slate-900">KUWI Dashboard</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">{userEmail}</p>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveSection('overview')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  activeSection === 'overview'
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>📊</span>
                <span>نظرة عامة (Overview)</span>
              </button>

              <button
                onClick={() => setActiveSection('cards')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  activeSection === 'cards'
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>📇</span>
                <span>كروتي الذكية ({cards.length})</span>
              </button>

              <button
                onClick={() => setActiveSection('leads')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  activeSection === 'leads'
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>👥</span>
                <span>العملاء المحتملون (Leads)</span>
              </button>

              <button
                onClick={() => setActiveSection('custody')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  activeSection === 'custody'
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🛡️</span>
                <span>العُهدة والمفقود (Custody)</span>
              </button>
            </nav>

          </div>

          {/* Quick Links Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-col gap-2">
            {loyaltyProgram && (
              <Link
                href="/dashboard/loyalty"
                className="flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-2xl text-xs transition"
              >
                <span>برنامج الولاء (Loyalty)</span>
                <span>🎁</span>
              </Link>
            )}
            <Link
              href="/admin"
              className="flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition"
            >
              <span>مشرف النظام (Admin)</span>
              <span>⚡</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-5xl">

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {cards.length === 0 && !loyaltyProgram ? (
            <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-200/80 my-auto">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                🏷️
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">ليس لديك أي كروت مفعلة حالياً</h2>
              <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
                قم بتفعيل كارت جديد باستخدام رمز الـ QR أو كود التفعيل الموجود على بطاقتك الذكية.
              </p>
              <div className="max-w-xs mx-auto flex gap-2">
                <input
                  type="text"
                  placeholder="أدخل كود الكارت (مثال: AB12CD)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      window.location.href = `/activate/${(e.target as HTMLInputElement).value}`;
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-center"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">

              {/* SECTION 1: OVERVIEW */}
              {activeSection === 'overview' && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col">
                      <span className="text-xs text-slate-400 font-medium mb-1">إجمالي الكروت النشطة</span>
                      <span className="text-3xl font-black text-slate-900">{cards.length}</span>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col">
                      <span className="text-xs text-slate-400 font-medium mb-1">إجمالي المسحات والنقرات</span>
                      <span className="text-3xl font-black text-blue-600">{totalScans}</span>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col">
                      <span className="text-xs text-slate-400 font-medium mb-1">إجمالي العملاء المهتمين (Leads)</span>
                      <span className="text-3xl font-black text-emerald-600">{totalLeads}</span>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80">
                    <h2 className="text-base font-bold text-slate-900 mb-4">ملخص الأسطول والبطاقات</h2>
                    <div className="divide-y divide-slate-100">
                      {cards.map((c) => (
                        <div key={c.id} className="py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-slate-100 font-mono font-bold flex items-center justify-center text-xs text-slate-700">
                              {c.code}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                {c.business_card?.full_name || `كارت (${c.product})`}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-mono">
                                الدفعة: {c.batch_name || 'عام'} • الحالة: {c.status}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                            <span>مسحات: <strong>{c.scan_count || 0}</strong></span>
                            <span>Leads: <strong>{c.leads?.length || 0}</strong></span>
                            <button
                              onClick={() => {
                                setSelectedCardId(c.id);
                                setActiveSection('cards');
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition"
                            >
                              إدارة ⚙️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: CARDS EDITOR */}
              {activeSection === 'cards' && cards.length > 0 && (
                <div className="flex flex-col gap-6">
                  
                  {/* Card Selector Header */}
                  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-auto flex-1">
                      <label className="block text-[11px] text-slate-400 font-medium mb-1">اختر الكارت للتعديل</label>
                      <select
                        value={selectedCardId}
                        onChange={(e) => handleCardSelect(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      >
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            [{c.status.toUpperCase()}] {c.code} ({c.product}) {c.business_card?.full_name ? `- ${c.business_card.full_name}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCard && selectedCard.product === 'business' && selectedCard.business_card && (
                      <a
                        href={`/c/${selectedCard.business_card.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm whitespace-nowrap"
                      >
                        معاينة الكارت الحية ↗
                      </a>
                    )}
                  </div>

                  {/* Editor Form */}
                  {selectedCard && selectedCard.product === 'business' && selectedCard.business_card && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col gap-6">
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <h3 className="text-base font-bold text-slate-900">تعديل محتوى كارت الأعمال الذكي والخصوصية</h3>
                        
                        {/* Share Presets */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                          <span className="px-2 text-slate-500 font-medium">قوالب العرض:</span>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('all')}
                            className="px-3 py-1.5 bg-white text-slate-800 font-bold rounded-lg shadow-xs hover:bg-slate-50 transition"
                          >
                            الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('work')}
                            className="px-3 py-1.5 bg-white text-slate-800 font-bold rounded-lg shadow-xs hover:bg-slate-50 transition"
                          >
                            بيانات العمل فقط
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('social_pay')}
                            className="px-3 py-1.5 bg-white text-slate-800 font-bold rounded-lg shadow-xs hover:bg-slate-50 transition"
                          >
                            التواصل والمدفوعات
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleBusinessSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
                          <input
                            type="text"
                            name="full_name"
                            defaultValue={selectedCard.business_card.full_name}
                            required
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
                          <input
                            type="text"
                            name="job_title"
                            defaultValue={selectedCard.business_card.job_title || ''}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة / النشاط</label>
                          <input
                            type="text"
                            name="company"
                            defaultValue={selectedCard.business_card.company || ''}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">رقم الموبايل</label>
                          <input
                            type="tel"
                            name="phone"
                            dir="ltr"
                            defaultValue={selectedCard.business_card.phone || ''}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">رقم واتساب</label>
                          <input
                            type="tel"
                            name="whatsapp"
                            dir="ltr"
                            defaultValue={selectedCard.business_card.whatsapp || ''}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                          <input
                            type="email"
                            name="email"
                            dir="ltr"
                            defaultValue={selectedCard.business_card.email || ''}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">فودافون كاش</label>
                          <input
                            type="text"
                            name="vodafone_cash"
                            dir="ltr"
                            defaultValue={selectedCard.business_card.vodafone_cash || ''}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">انستاباي (InstaPay Link)</label>
                          <input
                            type="url"
                            name="instapay_url"
                            dir="ltr"
                            defaultValue={selectedCard.business_card.instapay_url || ''}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">نبذة تعريفية (Bio)</label>
                          <textarea
                            name="bio"
                            rows={2}
                            defaultValue={selectedCard.business_card.bio || ''}
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        {/* Avatar Upload / URL */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">الصورة الشخصية / الشعار (Avatar)</label>
                          <div className="flex items-center gap-4 mb-2">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Avatar Preview" className="w-14 h-14 rounded-full object-cover border" />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500 font-bold">
                                بدون صورة
                              </div>
                            )}
                            <div className="flex-1 flex flex-col gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                className="w-full text-xs text-slate-500 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                              <input
                                type="url"
                                name="avatar_url"
                                dir="ltr"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="أو أدخل رابط صورة مباشر https://..."
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-right"
                              />
                            </div>
                          </div>
                          {uploadingAvatar && <p className="text-[11px] text-blue-600">جاري رفع الصورة...</p>}
                        </div>

                        {/* Selective Field Privacy Toggles */}
                        <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-800 mb-3">إظهار/إخفاء الحقول (Privacy Toggles)</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { key: 'phone', label: 'الاتصال المباشر' },
                              { key: 'whatsapp', label: 'واتساب' },
                              { key: 'email', label: 'البريد الإلكتروني' },
                              { key: 'website', label: 'الموقع' },
                              { key: 'vodafone_cash', label: 'فودافون كاش' },
                              { key: 'instapay', label: 'انستاباي' },
                              { key: 'bio', label: 'النبذة التعريفية' },
                            ].map(({ key, label }) => {
                              const isVisible = visibleFields[key] !== false;
                              return (
                                <label key={key} className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200">
                                  <input
                                    type="checkbox"
                                    checked={isVisible}
                                    onChange={() => handleToggleField(key)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-[11px] font-medium text-slate-700">{label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">لون الهوية (Theme Color)</label>
                          <input
                            type="color"
                            name="theme_color"
                            defaultValue={selectedCard.business_card.theme_color || '#0F172A'}
                            className="w-full h-10 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                          />
                        </div>

                        <div className="sm:col-span-2 pt-2">
                          <button
                            type="submit"
                            disabled={isPending}
                            className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                          >
                            {isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {selectedCard && selectedCard.product === 'review' && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
                      <h3 className="text-base font-bold text-slate-900 mb-4">تعديل رابط توجيه تقييمات جوجل</h3>
                      <form onSubmit={handleReviewUrlSubmit} className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط خرائط جوجل (Google Maps / Review URL)</label>
                          <input
                            type="url"
                            name="target_url"
                            required
                            dir="ltr"
                            defaultValue={selectedCard.target_url || ''}
                            placeholder="https://g.page/r/..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-right"
                          />
                        </div>
                        <div>
                          <button
                            type="submit"
                            disabled={isPending}
                            className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                          >
                            {isPending ? 'جاري الحفظ...' : 'حفظ الرابط'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              )}

              {/* SECTION 3: LEADS */}
              {activeSection === 'leads' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 mb-1">العملاء المهتمون (Leads)</h2>
                      <p className="text-xs text-slate-500">إجمالي العملاء المسجلين عبر جميع كروتك ({totalLeads})</p>
                    </div>
                    {cards.some((c) => (c.leads?.length || 0) > 0) && (
                      <button
                        onClick={() => {
                          const allLeads = cards.flatMap((c) => c.leads || []);
                          handleExportLeads(allLeads);
                        }}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
                      >
                        تصدير كافة Leads إلى CSV 📥
                      </button>
                    )}
                  </div>

                  {totalLeads === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-12">لا توجد بيانات عملاء مسجلة حتى الآن.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-medium">
                            <th className="pb-3 pr-2">الكارت</th>
                            <th className="pb-3 px-2">اسم العميل</th>
                            <th className="pb-3 px-2">رقم الموبايل</th>
                            <th className="pb-3 px-2">ملاحظة</th>
                            <th className="pb-3 pl-2 text-left">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {cards.flatMap((c) => (c.leads || []).map((lead: any) => ({ ...lead, cardCode: c.code }))).map((lead: any) => (
                            <tr key={lead.id} className="text-slate-700">
                              <td className="py-3 pr-2 font-mono font-bold text-blue-600">#{lead.cardCode}</td>
                              <td className="py-3 px-2 font-bold text-slate-900">{lead.visitor_name}</td>
                              <td className="py-3 px-2 font-mono">{lead.visitor_phone}</td>
                              <td className="py-3 px-2 text-slate-500">{lead.visitor_note || '-'}</td>
                              <td className="py-3 pl-2 text-left text-slate-400 font-mono">
                                {new Date(lead.created_at).toLocaleString('ar-EG')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: CUSTODY & LOST MODE */}
              {activeSection === 'custody' && selectedCard && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col gap-8">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 mb-1">إدارة العهدة، المفقود، ونقل الملكية ({selectedCard.code})</h2>
                    <p className="text-xs text-slate-500">التحكم في حالة الكارت، تفعيل وضع الفقدان، نقل العهدة لموظف جديد، أو نقل الملكية بالكامل للعميل.</p>
                  </div>

                  {/* Lost Card Mode Toggle */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-1">وضع الكارت المفقود (Lost Card Mode)</h4>
                      <p className="text-xs text-slate-500">عند تفعيل وضع الفقدان، سيظهر للناس تنبيه استرداد عند مسح الكارت.</p>
                    </div>
                    <select
                      value={selectedCard.status}
                      onChange={(e) => handleStatusChange(e.target.value as CardStatus)}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="active">نشط (Active)</option>
                      <option value="lost">مفقود (Lost Mode ⚠️)</option>
                      <option value="suspended">موقوف (Suspended)</option>
                    </select>
                  </div>

                  {/* Ownership Transfer */}
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-900 mb-1">نقل ملكية الكارت لحساب عميل (Ownership Transfer)</h4>
                    <p className="text-xs text-blue-700/80 mb-3">نقل ملكية الكارت بالكامل إلى البريد الإلكتروني المسجل للعميل.</p>
                    <form onSubmit={handleTransferOwnership} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        required
                        dir="ltr"
                        value={transferEmail}
                        onChange={(e) => setTransferEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="w-full sm:flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-right font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition whitespace-nowrap"
                      >
                        نقل الملكية نهائياً 👑
                      </button>
                    </form>
                  </div>

                  {/* Custody Reassignment */}
                  {selectedCard.product === 'business' && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                      <h4 className="text-xs font-bold text-slate-900 mb-1">إعادة تعيين عهدة الكارت لموظف جديد</h4>
                      <p className="text-xs text-slate-500 mb-3">تحديث بيانات الموظف المعين على الكارت مع خيار تفريغ سجل العملاء السابقين.</p>
                      <form onSubmit={handleCustodyReassign} className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            name="full_name"
                            required
                            placeholder="اسم الموظف الجديد"
                            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                          <input
                            type="text"
                            name="job_title"
                            placeholder="المسمى الوظيفي"
                            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                          <input
                            type="tel"
                            name="phone"
                            dir="ltr"
                            placeholder="رقم الموبايل"
                            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-right font-mono"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            name="clear_leads"
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          />
                          <span className="text-[11px] font-bold text-rose-700">تفريغ سجل العملاء (Leads) السابق الخاص بالموظف المغادر</span>
                        </label>
                        <div>
                          <button
                            type="submit"
                            disabled={isPending}
                            className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                          >
                            تحديث عهدة الموظف 🔄
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </main>

      </div>
    </div>
  );
}
