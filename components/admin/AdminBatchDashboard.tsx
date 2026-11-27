'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CardStatus, CardSurfaceTheme, CardWithDetails, Company } from '@/types/smart-cards';
import {
  createCompanyAction,
  generateBatchAction,
  provisionIndividualClientCardAction,
  updateCardStatusAction,
} from '@/app/actions/admin';
import {
  ArrowUpLeftIcon,
  BuildingIcon,
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  SparklesIcon,
} from '@/components/ui/Icons';

interface AdminBatchDashboardProps {
  cards: CardWithDetails[];
  batches: string[];
  companies: Company[];
}

export default function AdminBatchDashboard({
  cards,
  batches,
  companies,
}: AdminBatchDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'express_individual' | 'companies' | 'inventory'>(
    'express_individual'
  );

  // Express Client Form Controlled State (supports 1-click presets like Eng. Ahmed Wasim)
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [bio, setBio] = useState('');
  const [surfaceTheme, setSurfaceTheme] = useState<CardSurfaceTheme>('obsidian');

  const [createdResult, setCreatedResult] = useState<{ code: string; slug: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://kuwi-liart.vercel.app';

  const copyText = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1-Click Quick Preset for Tomorrow's Client Delivery (Eng. Ahmed Wasim)
  const fillAhmedWasimPreset = () => {
    setFullName('Eng. Ahmed Wasim');
    setJobTitle('Electrical Power Engineer');
    setCompanyName('EMZ Power Engineering');
    setCustomSlug('ahmed-wasim');
    setPhone('01129927315');
    setPhone2('01020337314');
    setWhatsapp('01129927315');
    setFacebook('https://www.facebook.com/share/1F8NFfXHL9/');
    setInstagram('https://www.instagram.com/eng_ahmed_wasim');
    setLinkedin('https://www.linkedin.com/in/ahmed-wasim-4a0746326');
    setBio('مهندس قوى وآلات كهربية — تواصل معي مباشرة عبر الهاتف أو واتساب أو حساباتي الرسمية.');
    setSurfaceTheme('obsidian');
    setCreatedResult(null);
    setErrorMsg(null);
  };

  const handleProvisionIndividual = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.set('surface_theme', surfaceTheme);

    startTransition(async () => {
      const res = await provisionIndividualClientCardAction(formData);
      if (!res.success || !res.code || !res.slug) {
        setErrorMsg(res.error || 'تعذر إنشاء كارت العميل.');
      } else {
        setCreatedResult({ code: res.code, slug: res.slug });
        setSuccessMsg(`تم تجهيز وتفعيل كارت (${fullName}) بنجاح. جاهز للبرمجة والتسليم فوراً.`);
        router.refresh();
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
        setErrorMsg(res.error || 'تعذر إنشاء مساحة الشركة.');
      } else {
        const extra = res.generatedCards ? ` وتوليد ${res.generatedCards} كارت لأسطولها` : '';
        setSuccessMsg(`تم إنشاء مساحة الشركة${extra} بنجاح.`);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    });
  };

  const handleGenerateBatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await generateBatchAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر توليد الدفعة.');
      } else {
        setSuccessMsg(`تم توليد ${res.count} كارت جديد بنجاح.`);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    });
  };

  const handleStatusChange = (cardId: string, newStatus: CardStatus) => {
    startTransition(async () => {
      await updateCardStatusAction(cardId, newStatus);
      router.refresh();
    });
  };

  const filteredCards = cards.filter((c) => {
    const matchesBatch = batchFilter === 'ALL' || c.batch_name === batchFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      c.code.toLowerCase().includes(q) ||
      (c.business_card?.full_name || '').toLowerCase().includes(q) ||
      (c.batch_name || '').toLowerCase().includes(q);
    return matchesBatch && matchesQuery;
  });

  const handleExportCSV = (targetCards: CardWithDetails[], filenamePrefix = 'kuwi-cards') => {
    const headers = ['code', 'owner_or_employee', 'product', 'batch_name', 'status', 'nfc_qr_url', 'direct_card_url', 'client_claim_url'];
    const rows = targetCards.map((c) => [
      c.code,
      c.business_card?.full_name || '',
      c.product,
      c.batch_name || '',
      c.status,
      `${origin}/q/${c.code}`,
      c.business_card?.slug ? `${origin}/c/${c.business_card.slug}` : '',
      `${origin}/activate/${c.code}`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Top Bar */}
        <header className="bg-white p-6 rounded-3xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800 mb-2">
              <span>KUWI ADMIN CONSOLE</span>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-950">
              مركز تجهيز العملاء والشركات والمخزون
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              جهّز كارت عميل فردي في ثوانٍ، أو أنشئ بوابة شركة كاملة مع أسطول كروتها، أو صدّر ملفات الطباعة.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="min-h-[44px] px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <span>لوحة التحكم الموحدة</span>
              <ArrowUpLeftIcon size={15} />
            </Link>
          </div>
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-2xl border border-neutral-200 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('express_individual')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'express_individual'
                ? 'bg-[#181818] text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <SparklesIcon size={15} />
            <span>تجهيز كارت عميل فردي فوري</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'companies'
                ? 'bg-[#181818] text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <BuildingIcon size={15} />
            <span>الشركات والأسطول ({companies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-[#181818] text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <CreditCardIcon size={15} />
            <span>جميع الكروت والدفعات ({cards.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: EXPRESS INDIVIDUAL CLIENT BUILDER ================= */}
        {activeTab === 'express_individual' && (
          <div className="flex flex-col gap-6">
            {createdResult && (
              <div className="bg-[#181818] text-white p-6 sm:p-8 rounded-3xl border border-neutral-800 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
                      الكارت جاهز للتسليم والبرمجة الآن
                    </span>
                    <h2 className="text-xl font-semibold">
                      كود الشريحة: <span className="font-mono text-emerald-400">{createdResult.code}</span>
                    </h2>
                  </div>
                  <a
                    href={`/c/${createdResult.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-5 py-2.5 bg-white text-neutral-950 font-semibold rounded-xl text-xs inline-flex items-center gap-2"
                  >
                    <span>معاينة الكارت الحي</span>
                    <ArrowUpLeftIcon size={15} />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[#272727] border border-white/10 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">
                        1. رابط برمجة شريحة الـ NFC والـ QR
                      </div>
                      <p className="text-xs text-neutral-400 font-mono break-all" dir="ltr">
                        {origin}/q/{createdResult.code}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(`${origin}/q/${createdResult.code}`, 'res_nfc')}
                      className="min-h-[40px] py-2 px-3 bg-white text-neutral-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'res_nfc' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                      <span>نسخ رابط الـ NFC</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#272727] border border-white/10 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">
                        2. الرابط المباشر لصفحة العميل
                      </div>
                      <p className="text-xs text-neutral-400 font-mono break-all" dir="ltr">
                        {origin}/c/{createdResult.slug}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(`${origin}/c/${createdResult.slug}`, 'res_c')}
                      className="min-h-[40px] py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'res_c' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                      <span>نسخ رابط الصفحة</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#272727] border border-white/10 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">
                        3. رابط تسليم الملكية للعميل (واتساب)
                      </div>
                      <p className="text-xs text-neutral-400 font-mono break-all" dir="ltr">
                        {origin}/activate/{createdResult.code}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(`${origin}/activate/${createdResult.code}`, 'res_claim')
                      }
                      className="min-h-[40px] py-2 px-3 bg-emerald-500 text-neutral-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'res_claim' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                      <span>نسخ رابط تملك العميل</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-100">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">
                    إنشاء وتجهيز كارت عميل فردي في خطوة واحدة
                  </h2>
                  <p className="text-xs text-neutral-500">
                    يُنشئ الكارت مفعّلاً وجاهزاً للعمل فوراً، مع بقاء إمكانية استلام العميل لملكيته بحسابه الشخصي متى شاء.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fillAhmedWasimPreset}
                  className="min-h-[42px] px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  تعبئة بيانات م. أحمد وسيم تلقائياً ⚡
                </button>
              </div>

              <form onSubmit={handleProvisionIndividual} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    اسم العميل الكامل *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Eng. Ahmed Wasim"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    الرابط المخصص الاختياري (Slug)
                  </label>
                  <input
                    type="text"
                    name="custom_slug"
                    dir="ltr"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="ahmed-wasim"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    المسمى الوظيفي
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Electrical Power Engineer"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    الشركة / الجهة
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="اسم الشركة أو الكلية"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رقم الموبايل الأول
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01129927315"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رقم الموبايل الثاني (إضافي)
                  </label>
                  <input
                    type="tel"
                    name="phone2"
                    dir="ltr"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    placeholder="01020337314"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رقم واتساب
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    dir="ltr"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="01129927315"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    type="email"
                    name="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@email.com"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رابط LinkedIn
                  </label>
                  <input
                    type="text"
                    name="linkedin"
                    dir="ltr"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://www.linkedin.com/in/..."
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رابط Instagram
                  </label>
                  <input
                    type="text"
                    name="instagram"
                    dir="ltr"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://www.instagram.com/..."
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رابط Facebook
                  </label>
                  <input
                    type="text"
                    name="facebook"
                    dir="ltr"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://www.facebook.com/..."
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    نبذة تعريفية
                  </label>
                  <input
                    type="text"
                    name="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="نبذة مختصرة تظهر تحت الاسم..."
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    تصميم الواجهة
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'obsidian', label: 'Obsidian أسود فخم' },
                      { id: 'titanium', label: 'Titanium معدني' },
                      { id: 'pearl', label: 'Pearl أبيض' },
                      { id: 'emerald', label: 'Emerald زمردي' },
                      { id: 'amber', label: 'Amber ذهبي' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSurfaceTheme(t.id as CardSurfaceTheme)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          surfaceTheme === t.id
                            ? 'bg-[#181818] text-white border-[#181818]'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="min-h-[50px] py-3 px-8 bg-[#181818] hover:bg-neutral-800 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition cursor-pointer"
                  >
                    {isPending ? 'جاري التجهيز...' : 'إنشاء وتفعيل الكارت واستخراج روابط الـ NFC'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 2: COMPANIES & FLEET PROVISIONING ================= */}
        {activeTab === 'companies' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-950 mb-1">
                تجهيز باقة شركة كاملة + توليد كروت الموظفين دفعة واحدة
              </h2>
              <p className="text-xs text-neutral-500 mb-5">
                عند كتابة بريد مسؤول الشركة، سيتمكن أيضاً من الدخول للوحة التحكم ببريده وإدارة كامل أسطول شركته ذاتياً.
              </p>

              <form onSubmit={handleCreateCompany} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    اسم الشركة *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="شركة الأفق للهندسة"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    بريد مدير الموارد البشرية / المسؤول
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    dir="ltr"
                    placeholder="hr@company.com"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    عدد كروت الأسطول المطلوب توليدها فوراً
                  </label>
                  <input
                    type="number"
                    name="fleet_quantity"
                    min={0}
                    max={500}
                    defaultValue={15}
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div className="sm:col-span-3 pt-1">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="min-h-[48px] py-3 px-8 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    {isPending ? 'جاري التجهيز...' : 'إنشاء بوابة الشركة وتوليد أسطول الكروت'}
                  </button>
                </div>
              </form>
            </div>

            {/* Companies Table */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-950 mb-4">
                الشركات المفعّلة ({companies.length})
              </h2>

              {companies.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-8">
                  لا توجد شركات مسجلة بعد.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500">
                        <th className="pb-3 pr-2">الشركة</th>
                        <th className="pb-3 px-2">بريد المسؤول</th>
                        <th className="pb-3 px-2">دفعة الكروت</th>
                        <th className="pb-3 px-2">بوابة الإدارة</th>
                        <th className="pb-3 pl-2 text-left">ملف الطباعة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {companies.map((co) => {
                        const coCards = cards.filter((c) => c.batch_name === co.batch_name);
                        return (
                          <tr key={co.id}>
                            <td className="py-3.5 pr-2 font-semibold text-neutral-950 text-sm">
                              {co.name}
                            </td>
                            <td className="py-3.5 px-2 font-mono text-neutral-500" dir="ltr">
                              {co.contact_email || '—'}
                            </td>
                            <td className="py-3.5 px-2 font-mono text-neutral-700">
                              {co.batch_name || '—'} ({coCards.length})
                            </td>
                            <td className="py-3.5 px-2">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => copyText(`${origin}/org/${co.slug}`, co.slug)}
                                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold rounded-lg cursor-pointer"
                                >
                                  {copiedKey === co.slug ? 'تم النسخ' : 'نسخ رابط البوابة'}
                                </button>
                                <a
                                  href={`/org/${co.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neutral-950 font-semibold hover:underline"
                                >
                                  فتح ↗
                                </a>
                              </div>
                            </td>
                            <td className="py-3.5 pl-2 text-left">
                              <button
                                type="button"
                                onClick={() => handleExportCSV(coCards, `company-${co.slug}`)}
                                className="px-3 py-1.5 bg-[#181818] text-white font-semibold rounded-lg cursor-pointer"
                              >
                                تصدير CSV ({coCards.length})
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: BULK INVENTORY & ALL CARDS ================= */}
        {activeTab === 'inventory' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-950 mb-4">
                توليد دفعة كروت خام للطباعة المسبقة (Bulk Generator)
              </h2>

              <form onSubmit={handleGenerateBatch} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    المنتج
                  </label>
                  <select
                    name="product"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  >
                    <option value="business">كارت أعمال (Business)</option>
                    <option value="review">تقييمات جوجل (Review)</option>
                    <option value="loyalty">ولاء مطاعم (Loyalty)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    اسم الدفعة
                  </label>
                  <input
                    type="text"
                    name="batch_name"
                    required
                    placeholder="Batch-Zagazig-01"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    الكمية (1 - 500)
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min={1}
                    max={500}
                    defaultValue={25}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full min-h-[44px] py-2.5 px-5 bg-[#181818] text-white font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    توليد الدفعة
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-semibold text-neutral-950">
                  جدول الكروت ({filteredCards.length})
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث بالكود أو الاسم..."
                    className="min-h-[40px] px-3.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                  <select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="min-h-[40px] px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                  >
                    <option value="ALL">كل الدفعات</option>
                    {batches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleExportCSV(filteredCards)}
                    className="min-h-[40px] px-4 py-1.5 bg-[#181818] text-white font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    تصدير CSV للطباعة
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500">
                      <th className="pb-3 pr-2">الكود</th>
                      <th className="pb-3 px-2">صاحب الكارت</th>
                      <th className="pb-3 px-2">الدفعة</th>
                      <th className="pb-3 px-2">الحالة</th>
                      <th className="pb-3 px-2">روابط سريعة</th>
                      <th className="pb-3 pl-2 text-left">معاينة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredCards.map((card) => (
                      <tr key={card.id}>
                        <td className="py-3 pr-2 font-mono font-semibold text-neutral-950 text-sm">
                          {card.code}
                        </td>
                        <td className="py-3 px-2 font-medium text-neutral-800">
                          {card.business_card?.full_name || 'غير مفعل'}
                        </td>
                        <td className="py-3 px-2 font-mono text-neutral-500">
                          {card.batch_name || '—'}
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={card.status}
                            onChange={(e) => handleStatusChange(card.id, e.target.value as CardStatus)}
                            className="px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold"
                          >
                            <option value="unclaimed">غير مفعل</option>
                            <option value="active">نشط</option>
                            <option value="lost">مفقود</option>
                            <option value="suspended">موقوف</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyText(`${origin}/q/${card.code}`, `q_${card.id}`)}
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium cursor-pointer"
                            >
                              {copiedKey === `q_${card.id}` ? 'تم ✓' : 'رابط NFC'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copyText(`${origin}/activate/${card.code}`, `act_${card.id}`)
                              }
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg font-medium cursor-pointer"
                            >
                              {copiedKey === `act_${card.id}` ? 'تم ✓' : 'رابط التفعيل'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 pl-2 text-left">
                          <a
                            href={`/q/${card.code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-neutral-900 hover:underline"
                          >
                            فتح ↗
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
      </div>
    </div>
  );
}
