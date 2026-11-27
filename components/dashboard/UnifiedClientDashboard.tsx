'use client';

import React, { useState, useTransition } from 'react';
import { Card, BusinessCard } from '@/types/smart-cards';
import { updateBusinessCardAction, updateReviewCardTargetUrlAction } from '@/app/actions/dashboard';
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
  const [activeTab, setActiveTab] = useState<'cards' | 'loyalty'>('cards');
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const handleBusinessSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateBusinessCardAction(selectedCard.id, formData);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل التحديث');
      } else {
        setSuccessMsg('تم حفظ وتحديث الكارت بنجاح! ✅');
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

  // CSV Export for Leads
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">لوحة التحكم الموحدة</h1>
            <p className="text-xs text-slate-500">مرحباً بك، {userEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            {loyaltyProgram && (
              <Link
                href="/dashboard/loyalty"
                className="px-4 py-2.5 bg-amber-50 text-amber-800 font-bold rounded-xl text-xs hover:bg-amber-100 transition flex items-center gap-1.5"
              >
                <span>إدارة برنامج الولاء 🎁</span>
              </Link>
            )}
            <Link
              href="/admin"
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
            >
              مشرف النظام (Admin)
            </Link>
          </div>
        </div>

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
          <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🏷️
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">ليس لديك أي كروت مفعلة حالياً</h2>
            <p className="text-xs text-slate-500 mb-6">قم بتفعيل كارت جديد باستخدام رمز الكارت الموجود على البطاقة.</p>
            <div className="max-w-xs mx-auto flex gap-2">
              <input
                type="text"
                placeholder="أدخل كود الكارت (مثال: AB12CD)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `/activate/${(e.target as HTMLInputElement).value}`;
                  }
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* Tabs */}
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 w-fit">
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'cards' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                كروتي الذكية ({cards.length})
              </button>
              {loyaltyProgram && (
                <button
                  onClick={() => setActiveTab('loyalty')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'loyalty' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  برنامج الولاء (نشط)
                </button>
              )}
            </div>

            {activeTab === 'cards' && cards.length > 0 && (
              <div className="flex flex-col gap-6">
                
                {/* Card Selector & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">اختر الكارت للإدارة</span>
                      <select
                        value={selectedCardId}
                        onChange={(e) => setSelectedCardId(e.target.value)}
                        className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      >
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} ({c.product})
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedCard && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">إجمالي النقرات / المسحات</span>
                        <span className="font-black text-blue-600 text-base">{selectedCard.scan_count || 0}</span>
                      </div>
                    )}
                  </div>

                  {selectedCard && selectedCard.product === 'business' && selectedCard.business_card && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 md:col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                          Smart Business Card
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-2">{selectedCard.business_card.full_name}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">/c/{selectedCard.business_card.slug}</p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`/c/${selectedCard.business_card.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
                        >
                          معاينة الكارت ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedCard && selectedCard.product === 'review' && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 md:col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full uppercase">
                          Google Review Card
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-2">رابط توجيه تقييمات جوجل</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">{selectedCard.target_url || 'غير محدد'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Editor Forms */}
                {selectedCard && selectedCard.product === 'business' && selectedCard.business_card && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 mb-4">تعديل محتوى كارت الأعمال الذكي</h3>
                    
                    <form onSubmit={handleBusinessSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
                        <input
                          type="text"
                          name="full_name"
                          defaultValue={selectedCard.business_card.full_name}
                          required
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
                        <input
                          type="text"
                          name="job_title"
                          defaultValue={selectedCard.business_card.job_title || ''}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة / النشاط</label>
                        <input
                          type="text"
                          name="company"
                          defaultValue={selectedCard.business_card.company || ''}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رقم الموبايل</label>
                        <input
                          type="tel"
                          name="phone"
                          dir="ltr"
                          defaultValue={selectedCard.business_card.phone || ''}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رقم واتساب</label>
                        <input
                          type="tel"
                          name="whatsapp"
                          dir="ltr"
                          defaultValue={selectedCard.business_card.whatsapp || ''}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                        <input
                          type="email"
                          name="email"
                          dir="ltr"
                          defaultValue={selectedCard.business_card.email || ''}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">فودافون كاش</label>
                        <input
                          type="text"
                          name="vodafone_cash"
                          dir="ltr"
                          defaultValue={selectedCard.business_card.vodafone_cash || ''}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">انستاباي (InstaPay Link)</label>
                        <input
                          type="url"
                          name="instapay_url"
                          dir="ltr"
                          defaultValue={selectedCard.business_card.instapay_url || ''}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">نبذة تعريفية (Bio)</label>
                        <textarea
                          name="bio"
                          rows={2}
                          defaultValue={selectedCard.business_card.bio || ''}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
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
                  <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
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

                {/* Leads Section */}
                {selectedCard && selectedCard.leads && selectedCard.leads.length > 0 && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-slate-900">العملاء المهتمون (Leads)</h3>
                      <button
                        onClick={() => handleExportLeads(selectedCard.leads || [])}
                        className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
                      >
                        تصدير Leads إلى CSV 📥
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-medium">
                            <th className="pb-3 pr-2">الاسم</th>
                            <th className="pb-3 px-2">رقم الموبايل</th>
                            <th className="pb-3 px-2">ملاحظة</th>
                            <th className="pb-3 pl-2 text-left">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedCard.leads.map((lead) => (
                            <tr key={lead.id} className="text-slate-700">
                              <td className="py-3 pr-2 font-bold text-slate-900">{lead.visitor_name}</td>
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
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
