'use client';

import React, { useState, useTransition } from 'react';
import { Card } from '@/types/smart-cards';
import { generateBatchAction, updateCardStatusAction } from '@/app/actions/admin';
import Link from 'next/link';

interface AdminBatchDashboardProps {
  cards: Card[];
  batches: string[];
}

export default function AdminBatchDashboard({ cards, batches }: AdminBatchDashboardProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  const handleStatusChange = (cardId: string, newStatus: any) => {
    startTransition(async () => {
      await updateCardStatusAction(cardId, newStatus);
    });
  };

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kuwi-liart.vercel.app';
    const headers = ['code', 'product', 'batch_name', 'status', 'qr_url'];
    const rows = cards.map((c) => [
      c.code,
      c.product,
      c.batch_name || '',
      c.status,
      `${siteUrl}/q/${c.code}`,
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
            <p className="text-xs text-slate-500">توليد الدفعات، إدارة الكروت، وتصدير ملفات الطباعة CSV.</p>
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

        {/* Generator Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">توليد دفعة كروت جديدة (Bulk Generator)</h2>
          
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

            <div className="sm:col-span-2 lg:col-span-4 pt-2 flex items-center justify-between">
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
                      </select>
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
    </div>
  );
}
