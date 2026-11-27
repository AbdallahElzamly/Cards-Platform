'use client';

import React, { useState, useTransition } from 'react';
import { Card, Company } from '@/types/smart-cards';
import { generateBatchAction, updateCardStatusAction, createCompanyAction } from '@/app/actions/admin';
import Link from 'next/link';

interface AdminBatchDashboardProps {
  cards: Card[];
  batches: string[];
  companies: Company[];
}

export default function AdminBatchDashboard({ cards, batches, companies }: AdminBatchDashboardProps) {
  const [activeTab, setActiveTab] = useState<'individuals' | 'companies'>('individuals');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedCompanySlug, setCopiedCompanySlug] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await generateBatchAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل توليد البطاقات');
      } else {
        setSuccessMsg(`تم توليد ${res.count} كارت بنجاح! 🎉`);
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  const handleCreateCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createCompanyAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل إنشاء الشركة');
      } else {
        setSuccessMsg('تم إنشاء مساحة الشركة بنجاح! 🏢');
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  const handleStatusChange = (cardId: string, newStatus: any) => {
    startTransition(async () => {
      await updateCardStatusAction(cardId, newStatus);
    });
  };

  const handleCopyActivationLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kuwi-liart.vercel.app';
    const link = `${origin}/activate/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyCompanyPortalLink = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kuwi-liart.vercel.app';
    const link = `${origin}/org/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedCompanySlug(slug);
    setTimeout(() => setCopiedCompanySlug(null), 2000);
  };

  const handleExportCSV = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kuwi-liart.vercel.app';
    const headers = ['code', 'product', 'batch_name', 'status', 'qr_url', 'activation_url'];
    const rows = cards.map((c) => [
      c.code,
      c.product,
      c.batch_name || '',
      c.status,
      `${siteUrl}/q/${c.code}`,
      `${siteUrl}/activate/${c.code}`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cards-batch-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">لوحة تحكم المشرف (Admin)</h1>
            <p className="text-xs text-slate-500">إدارة الأفراد والشركات، الدفعات، وروابط التفعيل والتصدير.</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
          >
            الرئيسية / لوحة التحكم
          </Link>
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

        {/* Tabs: Individuals vs Companies */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 w-fit">
          <button
            onClick={() => setActiveTab('individuals')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'individuals' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            👤 الأفراد (Individuals)
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'companies' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            🏢 الشركات والأسطول (Companies)
          </button>
        </div>

        {/* TAB 1: INDIVIDUALS */}
        {activeTab === 'individuals' && (
          <div className="flex flex-col gap-6">
            
            {/* Generator Form */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-4">توليد دفعة كروت جديدة للأفراد (Bulk Generator)</h2>
              
              <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الكارت (Product)</label>
                  <select
                    name="product"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                  >
                    <option value="business">كارت أعمال (Business)</option>
                    <option value="review">تقييمات جوجل (Review)</option>
                    <option value="loyalty">ولاء العملاء (Loyalty)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الدفعة (Batch Name)</label>
                  <input
                    type="text"
                    name="batch_name"
                    required
                    placeholder="Zagazig-Batch-01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الكمية (1 - 500)</label>
                  <input
                    type="number"
                    name="quantity"
                    min={1}
                    max={500}
                    defaultValue={50}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط افتراضي (اختياري)</label>
                  <input
                    type="url"
                    name="target_url"
                    placeholder="https://g.page/r/..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none font-mono text-right"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    {isPending ? 'جاري التوليد...' : 'توليد البطاقات وإضافتها للقاعدة ⚡'}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    تصدير الكروت الظاهرة إلى CSV للطباعة 📥
                  </button>
                </div>
              </form>
            </div>

            {/* Cards Management Table */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">إدارة الكروت المسجلة ({cards.length})</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-3 pr-2">الكود (Code)</th>
                      <th className="pb-3 px-2">المنتج</th>
                      <th className="pb-3 px-2">اسم الدفعة</th>
                      <th className="pb-3 px-2">الحالة</th>
                      <th className="pb-3 px-2">رابط التفعيل</th>
                      <th className="pb-3 pl-2 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cards.map((card) => (
                      <tr key={card.id} className="text-slate-700 hover:bg-slate-50/50 transition">
                        <td className="py-3 pr-2 font-mono font-bold text-slate-900 text-sm">{card.code}</td>
                        <td className="py-3 px-2">
                          <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md uppercase text-[10px]">
                            {card.product}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-500">{card.batch_name || '-'}</td>
                        <td className="py-3 px-2">
                          <select
                            value={card.status}
                            onChange={(e) => handleStatusChange(card.id, e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                          >
                            <option value="unclaimed">غير مفعل (unclaimed)</option>
                            <option value="active">نشط (active)</option>
                            <option value="suspended">موقوف (suspended)</option>
                            <option value="lost">مفقود (lost)</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <button
                            type="button"
                            onClick={() => handleCopyActivationLink(card.code)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl transition text-[11px]"
                          >
                            {copiedCode === card.code ? 'تم النسخ ✓' : 'نسخ رابط التفعيل 📋'}
                          </button>
                        </td>
                        <td className="py-3 pl-2 text-left">
                          <a
                            href={`/q/${card.code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-bold"
                          >
                            اختبار الرابط ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: COMPANIES */}
        {activeTab === 'companies' && (
          <div className="flex flex-col gap-6">
            
            {/* Create Company Workspace Form */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-4">إنشاء مساحة عمل للشركات (Company Workspace)</h2>
              
              <form onSubmit={handleCreateCompany} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الشركة (Company Name)</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="شركة الأفق للتقنية"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">بريد مسؤول الشركة (Contact Email)</label>
                  <input
                    type="email"
                    name="contact_email"
                    placeholder="hr@horizon.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الدفعة المرتبطة (Batch Name)</label>
                  <select
                    name="batch_name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none font-mono"
                  >
                    <option value="">-- اختر دفعة الكروت --</option>
                    {batches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    {isPending ? 'جاري الإنشاء...' : 'إنشاء مساحة الشركة وتوليد بوابة الإدارة 🏢'}
                  </button>
                </div>
              </form>
            </div>

            {/* Companies List Table */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-4">الشركات المسجلة ({companies.length})</h2>

              {companies.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">لا توجد شركات مسجلة حتى الآن.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-medium">
                        <th className="pb-3 pr-2">اسم الشركة</th>
                        <th className="pb-3 px-2">البريد المسؤول</th>
                        <th className="pb-3 px-2">الدفعة المرتبطة</th>
                        <th className="pb-3 px-2">رابط البوابة التفاعلية (Portal Link)</th>
                        <th className="pb-3 pl-2 text-left">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {companies.map((co) => (
                        <tr key={co.id} className="text-slate-700 hover:bg-slate-50/50 transition">
                          <td className="py-3 pr-2 font-bold text-slate-900 text-sm">{co.name}</td>
                          <td className="py-3 px-2 text-slate-500">{co.contact_email || '-'}</td>
                          <td className="py-3 px-2 font-mono text-purple-600">{co.batch_name || 'الكل'}</td>
                          <td className="py-3 px-2">
                            <button
                              type="button"
                              onClick={() => handleCopyCompanyPortalLink(co.slug)}
                              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl transition text-[11px]"
                            >
                              {copiedCompanySlug === co.slug ? 'تم النسخ ✓' : 'نسخ رابط الشركة 📋'}
                            </button>
                          </td>
                          <td className="py-3 pl-2 text-left">
                            <a
                              href={`/org/${co.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:underline font-bold"
                            >
                              فتح بوابة الشركة ↗
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
