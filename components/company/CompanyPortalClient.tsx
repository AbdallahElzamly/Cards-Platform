'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CardWithDetails, Company, parseSocialLinks } from '@/types/smart-cards';
import { reassignCardCustodyAction } from '@/app/actions/dashboard';
import {
  ArrowUpLeftIcon,
  CheckIcon,
  CopyIcon,
  PhoneIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';

interface CompanyPortalClientProps {
  company: Company;
  cards: CardWithDetails[];
}

export default function CompanyPortalClient({ company, cards }: CompanyPortalClientProps) {
  const router = useRouter();
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0] || null;
  const selectedSocials = parseSocialLinks(selectedCard?.business_card?.social_links);

  const totalScans = cards.reduce((acc, c) => acc + (c.scan_count || 0), 0);
  const allLeads = cards.flatMap((c) =>
    (c.leads || []).map((l) => ({
      ...l,
      cardCode: c.code,
      employeeName: c.business_card?.full_name || 'موظف',
    }))
  );

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'https://kuwi-liart.vercel.app';

  const copyText = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCustodyReassign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;

    const formData = new FormData(e.currentTarget);
    formData.set('company', company.name);
    const clearLeads = formData.get('clear_leads') === 'on';

    startTransition(async () => {
      const res = await reassignCardCustodyAction(
        selectedCard.id,
        formData,
        clearLeads,
        company.slug
      );
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر تحديث بيانات الموظف.');
      } else {
        setSuccessMsg('تم تحديث بيانات الموظف وعهدة الكارت بنجاح.');
        router.refresh();
      }
    });
  };

  const handleExportLeads = () => {
    const headers = [
      'card_code',
      'employee_name',
      'visitor_name',
      'visitor_phone',
      'visitor_note',
      'created_at',
    ];
    const rows = allLeads.map((l) => [
      l.cardCode,
      l.employeeName,
      l.visitor_name,
      l.visitor_phone,
      l.visitor_note || '',
      l.created_at,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `company-leads-${company.slug}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Company Header */}
        <header className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-neutral-100 border border-neutral-200 text-neutral-800 font-semibold text-xs px-3 py-1 rounded-full mb-2">
              بوابة إدارة أسطول الشركة
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-950">{company.name}</h1>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              الدفعة: {company.batch_name || 'الكل'} • المسؤول: {company.contact_email || 'إدارة الشركة'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportLeads}
            className="min-h-[46px] py-2.5 px-5 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            تصدير تقارير العملاء (CSV / Excel)
          </button>
        </header>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl text-xs font-semibold text-center">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Fleet KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200">
            <span className="text-xs text-neutral-500 font-medium block mb-1">
              إجمالي كروت الموظفين
            </span>
            <span className="text-3xl font-semibold text-neutral-950 font-mono">{cards.length}</span>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-neutral-200">
            <span className="text-xs text-neutral-500 font-medium block mb-1">
              إجمالي المسحات (NFC & QR)
            </span>
            <span className="text-3xl font-semibold text-neutral-950 font-mono">{totalScans}</span>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-neutral-200">
            <span className="text-xs text-neutral-500 font-medium block mb-1">
              إجمالي العملاء المكتسبين (Leads)
            </span>
            <span className="text-3xl font-semibold text-emerald-700 font-mono">
              {allLeads.length}
            </span>
          </div>
        </div>

        {/* Employee Assignment & Custody Editor */}
        {cards.length > 0 && (
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950 mb-1">
                تعيين وتحديث بيانات موظف على الكارت
              </h2>
              <p className="text-xs text-neutral-500">
                اختر رقم الكارت من الأسطول وحدّث بيانات الموظف الحالي أو انقل العهدة لموظف جديد فوراً.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                اختر كارت الموظف
              </label>
              <select
                value={selectedCard?.id || ''}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full min-h-[46px] px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-semibold"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.business_card?.full_name || 'غير معين'}
                  </option>
                ))}
              </select>
            </div>

            {selectedCard && (
              <form
                key={selectedCard.id}
                onSubmit={handleCustodyReassign}
                className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      اسم الموظف *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      defaultValue={selectedCard.business_card?.full_name || ''}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      المسمى الوظيفي
                    </label>
                    <input
                      type="text"
                      name="job_title"
                      defaultValue={selectedCard.business_card?.job_title || ''}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      رقم الموبايل الأساسي
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      dir="ltr"
                      defaultValue={selectedCard.business_card?.phone || ''}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      رقم موبايل إضافي (اختياري)
                    </label>
                    <input
                      type="tel"
                      name="phone2"
                      dir="ltr"
                      defaultValue={selectedSocials.phone2 || ''}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      البريد الوظيفي
                    </label>
                    <input
                      type="email"
                      name="email"
                      dir="ltr"
                      defaultValue={selectedCard.business_card?.email || ''}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      رابط LinkedIn
                    </label>
                    <input
                      type="text"
                      name="linkedin"
                      dir="ltr"
                      defaultValue={selectedSocials.linkedin || ''}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="clear_leads"
                    className="rounded border-neutral-300"
                  />
                  <span className="text-xs font-medium text-red-700">
                    مسح سجل العملاء السابق عند نقل الكارت لموظف جديد
                  </span>
                </label>

                <div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="min-h-[44px] py-2.5 px-6 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    {isPending ? 'جاري التحديث...' : 'حفظ بيانات الموظف'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Fleet Directory Table */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-950 mb-4">
            جدول كروت الأسطول وروابط الـ NFC ({cards.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="pb-3 pr-2">الكود</th>
                  <th className="pb-3 px-2">الموظف</th>
                  <th className="pb-3 px-2">المسمى</th>
                  <th className="pb-3 px-2">المسحات</th>
                  <th className="pb-3 px-2">Leads</th>
                  <th className="pb-3 pl-2 text-left">الروابط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cards.map((card) => {
                  const nfcUrl = `${origin}/q/${card.code}`;
                  return (
                    <tr key={card.id}>
                      <td className="py-3.5 pr-2 font-mono font-semibold text-neutral-950 text-sm">
                        {card.code}
                      </td>
                      <td className="py-3.5 px-2 font-semibold text-neutral-900">
                        {card.business_card?.full_name || 'غير معين'}
                      </td>
                      <td className="py-3.5 px-2 text-neutral-500">
                        {card.business_card?.job_title || '—'}
                      </td>
                      <td className="py-3.5 px-2 font-mono font-semibold">{card.scan_count || 0}</td>
                      <td className="py-3.5 px-2 font-mono font-semibold text-emerald-700">
                        {card.leads?.length || 0}
                      </td>
                      <td className="py-3.5 pl-2 text-left">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyText(nfcUrl, card.id)}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === card.id ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                            <span>نسخ NFC</span>
                          </button>
                          <a
                            href={nfcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#181818] text-white rounded-lg font-medium inline-flex items-center gap-1"
                          >
                            <span>معاينة</span>
                            <ArrowUpLeftIcon size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Central Leads Table */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-950 mb-4">
            سجل عملاء الأسطول الموحد ({allLeads.length})
          </h2>

          {allLeads.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-8">
              لا توجد بيانات عملاء مسجلة بعد.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="pb-3 pr-2">الموظف</th>
                    <th className="pb-3 px-2">اسم العميل</th>
                    <th className="pb-3 px-2">رقم الهاتف</th>
                    <th className="pb-3 px-2">ملاحظة</th>
                    <th className="pb-3 pl-2 text-left">تواصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {allLeads.map((lead) => {
                    const cleanWa = lead.visitor_phone.replace(/\D/g, '').replace(/^0/, '20');
                    return (
                      <tr key={lead.id}>
                        <td className="py-3 pr-2 font-semibold text-neutral-900">
                          {lead.employeeName} ({lead.cardCode})
                        </td>
                        <td className="py-3 px-2 font-semibold text-neutral-950">
                          {lead.visitor_name}
                        </td>
                        <td className="py-3 px-2 font-mono" dir="ltr">
                          {lead.visitor_phone}
                        </td>
                        <td className="py-3 px-2 text-neutral-500">{lead.visitor_note || '—'}</td>
                        <td className="py-3 pl-2 text-left">
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={`https://wa.me/${cleanWa}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold inline-flex items-center gap-1"
                            >
                              <WhatsAppIcon size={13} />
                              <span>واتساب</span>
                            </a>
                            <a
                              href={`tel:${lead.visitor_phone}`}
                              className="px-2.5 py-1 bg-neutral-100 text-neutral-800 rounded-lg font-semibold inline-flex items-center gap-1"
                            >
                              <PhoneIcon size={13} />
                              <span>اتصال</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
