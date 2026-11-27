'use client';

import React, { useState, useTransition } from 'react';
import { Company, Card, BusinessCard } from '@/types/smart-cards';
import { reassignCardCustodyAction } from '@/app/actions/dashboard';

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

interface CompanyPortalClientProps {
  company: Company;
  cards: CardWithDetails[];
}

export default function CompanyPortalClient({ company, cards }: CompanyPortalClientProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const totalScans = cards.reduce((acc, c) => acc + (c.scan_count || 0), 0);
  const totalLeads = cards.reduce((acc, c) => acc + (c.leads?.length || 0), 0);

  const handleCustodyReassign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    if (!window.confirm('هل أنت متأكد من إعادة تعيين الكارت للموظف الجديد؟')) {
      return;
    }

    const formData = new FormData(e.currentTarget);
    const clearLeads = (formData.get('clear_leads') === 'on');

    startTransition(async () => {
      const res = await reassignCardCustodyAction(selectedCard.id, formData, clearLeads);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل نقل عهدة الكارت');
      } else {
        setSuccessMsg('تم تحديث عهدة الموظف بنجاح! 🔄 (يرجى تحديث الصفحة لرؤية التغييرات)');
      }
    });
  };

  const handleExportLeads = (leadsList: any[]) => {
    const headers = ['card_code', 'employee_name', 'visitor_name', 'visitor_phone', 'visitor_note', 'created_at'];
    const rows = leadsList.map((l) => [l.cardCode, l.employeeName, l.visitor_name, l.visitor_phone, l.visitor_note || '', l.created_at]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `company-leads-${company.slug}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Company Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-purple-100 text-purple-700 font-bold text-xs px-3 py-1 rounded-full uppercase">
              بوابة الشركة التفاعلية (Company Portal)
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 mb-1">{company.name}</h1>
            <p className="text-xs text-slate-500 font-mono">الدفعة المرتبطة: {company.batch_name || 'الكل'} • المسؤول: {company.contact_email || 'غير محدد'}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const allLeads = cards.flatMap((c) => (c.leads || []).map((l: any) => ({ ...l, cardCode: c.code, employeeName: c.business_card?.full_name || 'موظف' })));
                handleExportLeads(allLeads);
              }}
              className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition shadow-sm"
            >
              تصدير كافة تقارير Leads لشيت إكسل (CSV) 📥
            </button>
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

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col">
            <span className="text-xs text-slate-400 font-medium mb-1">إجمالي كروت أسطول الشركة</span>
            <span className="text-3xl font-black text-slate-900">{cards.length}</span>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col">
            <span className="text-xs text-slate-400 font-medium mb-1">إجمالي مسحات الكروت (Scans)</span>
            <span className="text-3xl font-black text-blue-600">{totalScans}</span>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col">
            <span className="text-xs text-slate-400 font-medium mb-1">إجمالي العملاء المتواصلين (Leads)</span>
            <span className="text-3xl font-black text-emerald-600">{totalLeads}</span>
          </div>
        </div>

        {/* Cards Fleet Table & Links */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-4">كروت أسطول الشركة وروابط الـ NFC</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-3 pr-2">الكود</th>
                  <th className="pb-3 px-2">الموظف / صاحب الكارت</th>
                  <th className="pb-3 px-2">الحالة</th>
                  <th className="pb-3 px-2">المسحات</th>
                  <th className="pb-3 px-2">العملاء (Leads)</th>
                  <th className="pb-3 pl-2 text-left">رابط الكارت (NFC / QR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cards.map((card) => {
                  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kuwi-liart.vercel.app';
                  const cardUrl = `${siteUrl}/q/${card.code}`;
                  return (
                    <tr key={card.id} className="text-slate-700 hover:bg-slate-50/50 transition">
                      <td className="py-3.5 pr-2 font-mono font-bold text-slate-900 text-sm">{card.code}</td>
                      <td className="py-3.5 px-2 font-bold text-blue-700">{card.business_card?.full_name || 'غير معيين'}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          card.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-mono font-bold">{card.scan_count || 0}</td>
                      <td className="py-3.5 px-2 font-mono font-bold text-emerald-600">{card.leads?.length || 0}</td>
                      <td className="py-3.5 pl-2 text-left">
                        <a
                          href={cardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-blue-600 hover:underline"
                        >
                          {cardUrl} ↗
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee Custody Reassignment Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-2">تحديث عُهدة موظف (Custody Reassignment)</h2>
          <p className="text-xs text-slate-500 mb-6">اختر كارد ونقل عهدته لموظف جديد في الشركة.</p>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر الكارت</label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.business_card?.full_name || 'بدون موظف'}
                  </option>
                ))}
              </select>
            </div>

            {selectedCard && (
              <form onSubmit={handleCustodyReassign} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">اسم الموظف الجديد</label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      defaultValue={selectedCard.business_card?.full_name || ''}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">المسمى الوظيفي</label>
                    <input
                      type="text"
                      name="job_title"
                      defaultValue={selectedCard.business_card?.job_title || ''}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">رقم الموبايل</label>
                    <input
                      type="tel"
                      name="phone"
                      dir="ltr"
                      defaultValue={selectedCard.business_card?.phone || ''}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-right font-mono"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    name="clear_leads"
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[11px] font-bold text-rose-700">تفريغ / مسح سجل العملاء (Leads) السابق الخاص بالموظف المغادر</span>
                </label>

                <div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                  >
                    {isPending ? 'جاري الحفظ...' : 'حفظ ونقل عهدة الكارت للموظف الجديد 🔄'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Company Leads Feed */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">سجل التواصل والعملاء المحتملين لجميع كروت الشركة</h2>
            <button
              onClick={() => {
                const allLeads = cards.flatMap((c) => (c.leads || []).map((l: any) => ({ ...l, cardCode: c.code, employeeName: c.business_card?.full_name || 'موظف' })));
                handleExportLeads(allLeads);
              }}
              className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
            >
              تصدير كافة Leads لشيت إكسل 📥
            </button>
          </div>

          {totalLeads === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">لا توجد بيانات عملاء مسجلة لبطاقات هذه الشركة حتى الآن.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 pr-2">الكارت</th>
                    <th className="pb-3 px-2">الموظف المسؤول</th>
                    <th className="pb-3 px-2">اسم العميل</th>
                    <th className="pb-3 px-2">رقم الموبايل</th>
                    <th className="pb-3 px-2">ملاحظة</th>
                    <th className="pb-3 pl-2 text-left">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cards.flatMap((c) => (c.leads || []).map((l: any) => ({ ...l, cardCode: c.code, employeeName: c.business_card?.full_name || 'موظف' }))).map((lead: any) => (
                    <tr key={lead.id} className="text-slate-700">
                      <td className="py-3 pr-2 font-mono font-bold text-blue-600">#{lead.cardCode}</td>
                      <td className="py-3 px-2 font-bold text-slate-900">{lead.employeeName}</td>
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

      </div>
    </div>
  );
}
