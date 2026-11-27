'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CardStatus,
  CardSurfaceTheme,
  CardWithDetails,
  Company,
  parseSocialLinks,
} from '@/types/smart-cards';
import {
  claimCardByCodeInDashboardAction,
  createCompanyEmployeeCardAction,
  createSelfServeCompanyAction,
  reassignCardCustodyAction,
  transferCardOwnershipAction,
  updateBusinessCardAction,
  updateCardStatusModeAction,
  updateReviewCardTargetUrlAction,
} from '@/app/actions/dashboard';
import { merchantSignOutAction } from '@/app/actions/auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  ArrowUpLeftIcon,
  BuildingIcon,
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  PhoneIcon,
  PlusIcon,
  ShieldIcon,
  SparklesIcon,
  UsersIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';

interface UnifiedClientDashboardProps {
  cards: CardWithDetails[];
  companies: Company[];
  fleetCards: CardWithDetails[];
  loyaltyProgram: { business_name?: string } | null;
  userEmail: string;
  isSuperAdmin: boolean;
}

export default function UnifiedClientDashboard({
  cards,
  companies,
  fleetCards,
  loyaltyProgram,
  userEmail,
  isSuperAdmin,
}: UnifiedClientDashboardProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<
    'overview' | 'cards' | 'companies' | 'leads' | 'custody'
  >(cards.length === 0 && companies.length > 0 ? 'companies' : 'overview');

  const allManageableCards = Array.from(
    new Map([...cards, ...fleetCards].map((c) => [c.id, c])).values()
  );

  const [selectedCardId, setSelectedCardId] = useState<string>(allManageableCards[0]?.id || '');
  const selectedCard =
    allManageableCards.find((c) => c.id === selectedCardId) || allManageableCards[0] || null;

  const selectedSocials = parseSocialLinks(selectedCard?.business_card?.social_links);

  const [avatarUrl, setAvatarUrl] = useState<string>(
    selectedCard?.business_card?.avatar_url || ''
  );
  const [surfaceTheme, setSurfaceTheme] = useState<CardSurfaceTheme>(
    selectedSocials.surface_theme || 'obsidian'
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [transferEmail, setTransferEmail] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaultVis = {
    phone: true,
    phone2: true,
    whatsapp: true,
    email: true,
    website: true,
    linkedin: true,
    instagram: true,
    facebook: true,
    tiktok: true,
    telegram: true,
    vodafone_cash: true,
    instapay: true,
    bio: true,
  };

  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    ...defaultVis,
    ...(selectedSocials.visible_fields || {}),
  });

  const handleCardSelect = (id: string) => {
    setSelectedCardId(id);
    const found = allManageableCards.find((c) => c.id === id);
    const soc = parseSocialLinks(found?.business_card?.social_links);
    setAvatarUrl(found?.business_card?.avatar_url || '');
    setSurfaceTheme(soc.surface_theme || 'obsidian');
    setVisibleFields({
      ...defaultVis,
      ...(soc.visible_fields || {}),
    });
  };

  const copyText = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyPreset = (preset: 'all' | 'work' | 'social_pay') => {
    if (preset === 'all') {
      setVisibleFields({ ...defaultVis });
    } else if (preset === 'work') {
      setVisibleFields({
        ...defaultVis,
        vodafone_cash: false,
        instapay: false,
        tiktok: false,
        facebook: false,
      });
    } else {
      setVisibleFields({
        ...defaultVis,
        email: false,
        linkedin: false,
        vodafone_cash: true,
        instapay: true,
      });
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير، الحد الأقصى 3 ميجابايت.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const filePath = `public/avatar-${selectedCard?.id || 'card'}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            setAvatarUrl(publicUrlData.publicUrl);
            setUploadingAvatar(false);
            return;
          }
        }
      }
    } catch {
      // fallback to DataURL below
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) setAvatarUrl(result);
      setUploadingAvatar(false);
    };
    reader.onerror = () => {
      setUploadingAvatar(false);
      setErrorMsg('تعذر قراءة ملف الصورة.');
    };
    reader.readAsDataURL(file);
  };

  const handleBusinessSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.set('avatar_url', avatarUrl);
    formData.set('surface_theme', surfaceTheme);

    const updatedSocials = {
      ...selectedSocials,
      surface_theme: surfaceTheme,
      visible_fields: visibleFields,
    };
    formData.set('social_links_json', JSON.stringify(updatedSocials));

    startTransition(async () => {
      const res = await updateBusinessCardAction(selectedCard.id, formData);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر حفظ التعديلات.');
      } else {
        setSuccessMsg('تم حفظ وتحديث بيانات الكارت بنجاح.');
        router.refresh();
      }
    });
  };

  const handleClaimCard = (e: React.FormEvent, batchName?: string) => {
    e.preventDefault();
    if (!claimCodeInput.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await claimCardByCodeInDashboardAction(claimCodeInput, batchName);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر تفعيل الكارت.');
      } else {
        setSuccessMsg(`تم ربط الكارت (${claimCodeInput.toUpperCase()}) بحسابك بنجاح.`);
        setClaimCodeInput('');
        router.refresh();
      }
    });
  };

  const handleCreateSelfCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createSelfServeCompanyAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر إنشاء مساحة الشركة.');
      } else {
        setSuccessMsg('تم إنشاء مساحة الشركة بنجاح. يمكنك الآن إضافة موظفيك وإدارة كروتهم.');
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    });
  };

  const handleCreateEmployeeCard = (e: React.FormEvent<HTMLFormElement>, companyId: string) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createCompanyEmployeeCardAction(companyId, formData);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر إضافة كارت الموظف.');
      } else {
        setSuccessMsg(`تم إصدار كارت الموظف الجديد بنجاح (الكود: ${res.code}).`);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    });
  };

  const handleStatusChange = (status: CardStatus) => {
    if (!selectedCard) return;
    startTransition(async () => {
      const res = await updateCardStatusModeAction(selectedCard.id, status);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر تحديث الحالة.');
      } else {
        setSuccessMsg(`تم تحديث حالة الكارت إلى (${status}).`);
        router.refresh();
      }
    });
  };

  const handleCustodyReassign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    const formData = new FormData(e.currentTarget);
    const clearLeads = formData.get('clear_leads') === 'on';

    startTransition(async () => {
      const res = await reassignCardCustodyAction(selectedCard.id, formData, clearLeads);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر نقل العهدة.');
      } else {
        setSuccessMsg('تم نقل عهدة الكارت وتحديث بيانات الموظف.');
        router.refresh();
      }
    });
  };

  const handleTransferOwnership = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard || !transferEmail.trim()) return;

    startTransition(async () => {
      const res = await transferCardOwnershipAction(selectedCard.id, transferEmail);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر نقل الملكية.');
      } else {
        setSuccessMsg(`تم نقل ملكية الكارت إلى (${transferEmail}) بنجاح.`);
        setTransferEmail('');
        router.refresh();
      }
    });
  };

  const handleReviewUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    const formData = new FormData(e.currentTarget);
    const targetUrl = formData.get('target_url')?.toString() || '';

    startTransition(async () => {
      const res = await updateReviewCardTargetUrlAction(selectedCard.id, targetUrl);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر حفظ الرابط.');
      } else {
        setSuccessMsg('تم حفظ رابط تقييم جوجل بنجاح.');
        router.refresh();
      }
    });
  };

  const handleExportLeads = (leadsRows: Array<{ cardCode: string; ownerName: string; visitor_name: string; visitor_phone: string; visitor_note: string | null; created_at: string }>) => {
    const headers = ['card_code', 'card_owner', 'visitor_name', 'visitor_phone', 'visitor_note', 'created_at'];
    const rows = leadsRows.map((l) => [
      l.cardCode,
      l.ownerName,
      l.visitor_name,
      l.visitor_phone,
      l.visitor_note || '',
      l.created_at,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kuwi-leads.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalScans = allManageableCards.reduce((acc, c) => acc + (c.scan_count || 0), 0);
  const allCombinedLeads = allManageableCards.flatMap((c) =>
    (c.leads || []).map((l) => ({
      ...l,
      cardCode: c.code,
      ownerName: c.business_card?.full_name || c.code,
    }))
  );

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;
  const currentCompanyCards = selectedCompany
    ? fleetCards.filter((c) => c.batch_name === selectedCompany.batch_name)
    : [];

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kuwi-liart.vercel.app';

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans antialiased" dir="rtl">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation (Full 1px perimeter border per ai-design-skills) */}
        <aside className="w-full lg:w-68 shrink-0">
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 flex flex-col justify-between gap-6 lg:sticky lg:top-6">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-[#181818] text-white font-bold text-sm flex items-center justify-center">
                    K
                  </span>
                  <div>
                    <div className="text-sm font-bold text-neutral-950">KUWI Studio</div>
                    <div className="text-xs text-neutral-400 font-mono truncate max-w-[150px]">
                      {userEmail}
                    </div>
                  </div>
                </Link>
              </div>

              <nav className="flex flex-col gap-1">
                {(
                  [
                    { id: 'overview', label: 'نظرة عامة', icon: <SparklesIcon size={17} /> },
                    {
                      id: 'cards',
                      label: `كروتي الذكية (${allManageableCards.length})`,
                      icon: <CreditCardIcon size={17} />,
                    },
                    {
                      id: 'companies',
                      label: `الشركات والفرق (${companies.length})`,
                      icon: <BuildingIcon size={17} />,
                    },
                    {
                      id: 'leads',
                      label: `العملاء المهتمون (${allCombinedLeads.length})`,
                      icon: <UsersIcon size={17} />,
                    },
                    {
                      id: 'custody',
                      label: 'العهدة ونقل الملكية',
                      icon: <ShieldIcon size={17} />,
                    },
                  ] as const
                ).map((item) => {
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                        active
                          ? 'bg-[#181818] text-white'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-100">
              <Link
                href="/dashboard/loyalty"
                className="min-h-[42px] px-3.5 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 font-semibold rounded-xl text-xs flex items-center justify-between transition"
              >
                <span className="truncate">
                  {loyaltyProgram?.business_name
                    ? `ولاء: ${loyaltyProgram.business_name}`
                    : 'لوحة ولاء المطاعم'}
                </span>
                <ArrowUpLeftIcon size={15} />
              </Link>

              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="min-h-[42px] px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 font-semibold rounded-xl text-xs flex items-center justify-between transition"
                >
                  <span>مركز التجهيز والمشرف (Admin)</span>
                  <ArrowUpLeftIcon size={15} />
                </Link>
              )}

              <form action={merchantSignOutAction}>
                <button
                  type="submit"
                  className="w-full min-h-[40px] px-3.5 py-2 text-neutral-500 hover:text-red-700 hover:bg-red-50 font-medium rounded-xl text-xs text-right transition cursor-pointer"
                >
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="flex-1 flex flex-col gap-6 min-w-0">
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

          {/* ================= SECTION 1: OVERVIEW ================= */}
          {activeSection === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Top KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-neutral-200">
                  <span className="text-xs font-medium text-neutral-500 block mb-1">
                    الكروت المفعلة في حسابك
                  </span>
                  <span className="text-3xl font-semibold text-neutral-950 font-mono">
                    {allManageableCards.length}
                  </span>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-neutral-200">
                  <span className="text-xs font-medium text-neutral-500 block mb-1">
                    إجمالي المسحات والزيارات
                  </span>
                  <span className="text-3xl font-semibold text-neutral-950 font-mono">
                    {totalScans}
                  </span>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-neutral-200">
                  <span className="text-xs font-medium text-neutral-500 block mb-1">
                    جهات الاتصال المكتسبة (Leads)
                  </span>
                  <span className="text-3xl font-semibold text-emerald-700 font-mono">
                    {allCombinedLeads.length}
                  </span>
                </div>
              </div>

              {/* Instant Claim New Card Box + Quick Company Shortcut */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 flex flex-col justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950 mb-1">
                      تفعيل وربط كارت ذكي جديد
                    </h2>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      استلمت كارت NFC جديد؟ أدخل الكود المكون من 6 خانات لربطه بحسابك وتخصيصه فوراً.
                    </p>
                  </div>
                  <form onSubmit={(e) => handleClaimCard(e)} className="flex gap-2">
                    <input
                      type="text"
                      value={claimCodeInput}
                      onChange={(e) => setClaimCodeInput(e.target.value)}
                      placeholder="مثال: AB23CD"
                      dir="ltr"
                      className="flex-1 min-h-[44px] px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono uppercase text-center focus:outline-none focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="min-h-[44px] px-5 py-2 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                    >
                      ربط الكارت
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-neutral-200 flex flex-col justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950 mb-1">
                      إدارة أسطول الشركات والموظفين
                    </h2>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {companies.length > 0
                        ? `تدير حالياً (${companies.length}) شركة بإجمالي (${fleetCards.length}) كارت موظف.`
                        : 'هل لديك فريق عمل أو شركة؟ أنشئ مساحة شركتك وأصدر كروت موظفيك وتابع مبيعاتهم.'}
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('companies')}
                      className="min-h-[44px] px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-semibold rounded-xl text-xs transition inline-flex items-center gap-2 cursor-pointer"
                    >
                      <BuildingIcon size={16} />
                      <span>
                        {companies.length > 0 ? 'فتح لوحة أسطول الشركة' : 'إنشاء مساحة شركة جديدة'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Cards List */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-neutral-950">جميع البطاقات النشطة</h2>
                  {isSuperAdmin && (
                    <Link
                      href="/admin"
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      تجهيز كارت عميل سريع من الإدارة ←
                    </Link>
                  )}
                </div>

                {allManageableCards.length === 0 ? (
                  <div className="py-10 text-center bg-neutral-50 rounded-2xl border border-neutral-200/70">
                    <p className="text-sm font-medium text-neutral-600 mb-1">
                      لا توجد بطاقات مرتبطة بهذا الحساب بعد
                    </p>
                    <p className="text-xs text-neutral-400">
                      أدخل كود البطاقة في المربع أعلاه أو افتح قسم الشركات لإصدار بطاقات فريقك.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {allManageableCards.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-2 rounded-xl bg-white border border-neutral-200 font-mono font-semibold text-xs text-neutral-900">
                            {c.code}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-neutral-950">
                              {c.business_card?.full_name || `كارت (${c.product})`}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {c.business_card?.job_title || c.batch_name || 'كارت فردي'} • المسحات:{' '}
                              <span className="font-mono font-semibold">{c.scan_count || 0}</span> • Leads:{' '}
                              <span className="font-mono font-semibold">{c.leads?.length || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {c.business_card?.slug && (
                            <a
                              href={`/c/${c.business_card.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[38px] px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
                            >
                              <span>معاينة</span>
                              <ArrowUpLeftIcon size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              handleCardSelect(c.id);
                              setActiveSection('cards');
                            }}
                            className="min-h-[38px] px-4 py-2 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                          >
                            تعديل البيانات
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SECTION 2: SMART CARD EDITOR ================= */}
          {activeSection === 'cards' && (
            <div className="flex flex-col gap-6">
              {allManageableCards.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-neutral-200 text-center">
                  <p className="text-sm text-neutral-600">
                    لا توجد كروت مفعلة حالياً. اربط كود كارتك أولاً من «نظرة عامة».
                  </p>
                </div>
              ) : (
                <>
                  {/* Card Picker + NFC / Direct URL Copy Bar */}
                  <div className="bg-white p-5 rounded-3xl border border-neutral-200 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-neutral-500 mb-1">
                          اختر البطاقة المراد تحريرها
                        </label>
                        <select
                          value={selectedCard?.id || ''}
                          onChange={(e) => handleCardSelect(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-semibold"
                        >
                          {allManageableCards.map((c) => (
                            <option key={c.id} value={c.id}>
                              [{c.code}] {c.business_card?.full_name || c.product} ({c.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedCard?.business_card?.slug && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyText(`${origin}/q/${selectedCard.code}`, 'nfc_q')}
                            className="min-h-[44px] px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === 'nfc_q' ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
                            <span>رابط برمجة الـ NFC</span>
                          </button>
                          <a
                            href={`/c/${selectedCard.business_card.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[44px] px-4 py-2 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                          >
                            <span>فتح الكارت الحي</span>
                            <ArrowUpLeftIcon size={15} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Full Business Card Editor */}
                  {selectedCard && selectedCard.product === 'business' && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col gap-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-950">
                            بيانات الهوية الرقمية وحسابات التواصل
                          </h3>
                          <p className="text-xs text-neutral-500">
                            أضف أرقامك، لينكدإن، فيسبوك، إنستجرام، والمحافظ الإلكترونية لتظهر فوراً عند لمس الكارت.
                          </p>
                        </div>

                        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs">
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('all')}
                            className="px-2.5 py-1.5 bg-white rounded-lg font-semibold text-neutral-900 cursor-pointer"
                          >
                            الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('work')}
                            className="px-2.5 py-1.5 bg-white rounded-lg font-semibold text-neutral-900 cursor-pointer"
                          >
                            عمل فقط
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('social_pay')}
                            className="px-2.5 py-1.5 bg-white rounded-lg font-semibold text-neutral-900 cursor-pointer"
                          >
                            تواصل ودفع
                          </button>
                        </div>
                      </div>

                      <form
                        key={selectedCard.id}
                        onSubmit={handleBusinessSubmit}
                        className="flex flex-col gap-6"
                      >
                        {/* Surface Theme Picker */}
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-2">
                            مظهر وتصميم البطاقة
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[
                              { id: 'obsidian', label: 'Obsidian أسود فخم', dot: 'bg-[#181818]' },
                              { id: 'titanium', label: 'Titanium رمادي معدني', dot: 'bg-[#313131]' },
                              { id: 'pearl', label: 'Pearl أبيض نقي', dot: 'bg-white border border-neutral-300' },
                              { id: 'emerald', label: 'Emerald زمردي', dot: 'bg-emerald-500' },
                              { id: 'amber', label: 'Amber ذهبي', dot: 'bg-amber-500' },
                            ].map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setSurfaceTheme(t.id as CardSurfaceTheme)}
                                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                                  surfaceTheme === t.id
                                    ? 'border-neutral-950 bg-neutral-950 text-white'
                                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                                }`}
                              >
                                <span className={`w-3 h-3 rounded-full shrink-0 ${t.dot}`} />
                                <span className="truncate">{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Basic Identity + Two Phones */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              الاسم الكامل
                            </label>
                            <input
                              type="text"
                              name="full_name"
                              required
                              defaultValue={selectedCard.business_card?.full_name || ''}
                              className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              المسمى الوظيفي / التخصص
                            </label>
                            <input
                              type="text"
                              name="job_title"
                              defaultValue={selectedCard.business_card?.job_title || ''}
                              placeholder="Electrical Power Engineer"
                              className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              الشركة / المؤسسة
                            </label>
                            <input
                              type="text"
                              name="company"
                              defaultValue={selectedCard.business_card?.company || ''}
                              className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              البريد الإلكتروني
                            </label>
                            <input
                              type="email"
                              name="email"
                              dir="ltr"
                              defaultValue={selectedCard.business_card?.email || ''}
                              className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              رقم الموبايل الأساسي (1)
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              dir="ltr"
                              defaultValue={selectedCard.business_card?.phone || ''}
                              placeholder="01129927315"
                              className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              رقم الموبايل الإضافي (2)
                            </label>
                            <input
                              type="tel"
                              name="phone2"
                              dir="ltr"
                              defaultValue={selectedSocials.phone2 || ''}
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
                              defaultValue={selectedCard.business_card?.whatsapp || ''}
                              placeholder="01129927315"
                              className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              الموقع الإلكتروني (Website)
                            </label>
                            <input
                              type="text"
                              name="website"
                              dir="ltr"
                              defaultValue={selectedCard.business_card?.website || ''}
                              placeholder="https://example.com"
                              className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              نبذة تعريفية قصيرة (Bio)
                            </label>
                            <textarea
                              name="bio"
                              rows={2}
                              defaultValue={selectedCard.business_card?.bio || ''}
                              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                            />
                          </div>
                        </div>

                        {/* Social Media Links */}
                        <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <h4 className="text-sm font-semibold text-neutral-950">
                              روابط شبكات التواصل الاجتماعي والأعمال
                            </h4>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              LinkedIn رابط حساب
                            </label>
                            <input
                              type="text"
                              name="linkedin"
                              dir="ltr"
                              defaultValue={selectedSocials.linkedin || ''}
                              placeholder="https://www.linkedin.com/in/..."
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              Instagram رابط حساب
                            </label>
                            <input
                              type="text"
                              name="instagram"
                              dir="ltr"
                              defaultValue={selectedSocials.instagram || ''}
                              placeholder="https://www.instagram.com/..."
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              Facebook رابط حساب
                            </label>
                            <input
                              type="text"
                              name="facebook"
                              dir="ltr"
                              defaultValue={selectedSocials.facebook || ''}
                              placeholder="https://www.facebook.com/..."
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              TikTok رابط حساب
                            </label>
                            <input
                              type="text"
                              name="tiktok"
                              dir="ltr"
                              defaultValue={selectedSocials.tiktok || ''}
                              placeholder="https://www.tiktok.com/@..."
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              Telegram رابط قناة أو حساب
                            </label>
                            <input
                              type="text"
                              name="telegram"
                              dir="ltr"
                              defaultValue={selectedSocials.telegram || ''}
                              placeholder="https://t.me/..."
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              Google Maps رابط الموقع الجغرافي
                            </label>
                            <input
                              type="text"
                              name="location_url"
                              dir="ltr"
                              defaultValue={selectedSocials.location_url || ''}
                              placeholder="https://maps.app.goo.gl/..."
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              عنوان رابط إضافي (مثال: السيرة الذاتية CV)
                            </label>
                            <input
                              type="text"
                              name="custom_link_title"
                              defaultValue={selectedSocials.custom_link_title || ''}
                              placeholder="السيرة الذاتية / سابقة الأعمال"
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              الرابط الإضافي (Drive / PDF / Portfolio)
                            </label>
                            <input
                              type="text"
                              name="custom_link_url"
                              dir="ltr"
                              defaultValue={selectedSocials.custom_link_url || ''}
                              placeholder="https://..."
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                            />
                          </div>
                        </div>

                        {/* Digital Wallets */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              رقم محفظة فودافون كاش (اختياري)
                            </label>
                            <input
                              type="text"
                              name="vodafone_cash"
                              dir="ltr"
                              defaultValue={selectedCard.business_card?.vodafone_cash || ''}
                              placeholder="010xxxxxxxx"
                              className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              رابط الدفع عبر InstaPay (اختياري)
                            </label>
                            <input
                              type="text"
                              name="instapay_url"
                              dir="ltr"
                              defaultValue={selectedCard.business_card?.instapay_url || ''}
                              placeholder="https://ipn.eg/S/..."
                              className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left"
                            />
                          </div>
                        </div>

                        {/* Avatar Upload */}
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                            الصورة الشخصية أو الشعار
                          </label>
                          <div className="flex items-center gap-4">
                            {avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-16 h-16 rounded-full object-cover border border-neutral-200 shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs text-neutral-500 font-semibold shrink-0">
                                صورة
                              </div>
                            )}
                            <div className="flex-1 flex flex-col gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                className="w-full text-xs text-neutral-500 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-900 hover:file:bg-neutral-200"
                              />
                              <input
                                type="text"
                                dir="ltr"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="أو الصق رابط صورة مباشر https://..."
                                className="w-full min-h-[40px] px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left"
                              />
                            </div>
                          </div>
                          {uploadingAvatar && (
                            <p className="text-xs text-neutral-500 mt-1">جاري رفع الصورة...</p>
                          )}
                        </div>

                        {/* Field Visibility Toggles */}
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                          <h4 className="text-xs font-semibold text-neutral-800 mb-3">
                            التحكم في إظهار أو إخفاء العناصر على البطاقة العامة
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                              { key: 'phone', label: 'الرقم الأساسي' },
                              { key: 'phone2', label: 'الرقم الثاني' },
                              { key: 'whatsapp', label: 'واتساب' },
                              { key: 'email', label: 'البريد' },
                              { key: 'linkedin', label: 'لينكدإن' },
                              { key: 'instagram', label: 'إنستجرام' },
                              { key: 'facebook', label: 'فيسبوك' },
                              { key: 'website', label: 'الموقع' },
                              { key: 'vodafone_cash', label: 'فودافون كاش' },
                              { key: 'instapay', label: 'انستاباي' },
                              { key: 'bio', label: 'النبذة' },
                            ].map(({ key, label }) => {
                              const checked = visibleFields[key] !== false;
                              return (
                                <label
                                  key={key}
                                  className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-xl border border-neutral-200"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setVisibleFields((prev) => ({
                                        ...prev,
                                        [key]: prev[key] === false ? true : false,
                                      }))
                                    }
                                    className="rounded border-neutral-300 text-neutral-900"
                                  />
                                  <span className="text-xs font-medium text-neutral-700">{label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={isPending}
                            className="min-h-[48px] py-3 px-8 bg-[#181818] hover:bg-neutral-800 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition cursor-pointer"
                          >
                            {isPending ? 'جاري الحفظ...' : 'حفظ جميع التعديلات'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {selectedCard && selectedCard.product === 'review' && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200">
                      <h3 className="text-base font-semibold text-neutral-950 mb-4">
                        رابط التوجيه المباشر لتقييمات خرائط جوجل
                      </h3>
                      <form onSubmit={handleReviewUrlSubmit} className="flex flex-col gap-4">
                        <input
                          type="url"
                          name="target_url"
                          required
                          dir="ltr"
                          defaultValue={selectedCard.target_url || ''}
                          placeholder="https://g.page/r/..."
                          className="w-full min-h-[46px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                        />
                        <div>
                          <button
                            type="submit"
                            disabled={isPending}
                            className="min-h-[46px] py-2.5 px-6 bg-[#181818] text-white font-semibold rounded-xl text-xs cursor-pointer"
                          >
                            حفظ الرابط
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ================= SECTION 3: COMPANIES & B2B FLEET ================= */}
          {activeSection === 'companies' && (
            <div className="flex flex-col gap-6">
              {/* Self-Serve Create New Company Workspace */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-950 mb-1">
                  {companies.length > 0
                    ? 'إدارة الشركات وأسطول كروت الموظفين'
                    : 'إنشاء مساحة عمل لشركتك وفريقك'}
                </h2>
                <p className="text-xs text-neutral-500 mb-4">
                  أنشئ مساحة شركة مستقلة لإصدار كروت الموظفين، متابعة مسحاتهم والعملاء المحتملين، ونقل العهدة بسهولة.
                </p>

                <form onSubmit={handleCreateSelfCompany} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    name="company_name"
                    required
                    placeholder="اسم الشركة (مثال: شركة النيل للتطوير العقاري)"
                    className="flex-1 min-h-[46px] px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="min-h-[46px] px-6 py-2.5 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusIcon size={16} />
                    <span>إنشاء مساحة شركة جديدة</span>
                  </button>
                </form>
              </div>

              {selectedCompany && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col gap-6">
                  {/* Company Switcher & Portal Link */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
                    <div className="flex-1">
                      {companies.length > 1 ? (
                        <select
                          value={selectedCompany.id}
                          onChange={(e) => setSelectedCompanyId(e.target.value)}
                          className="min-h-[44px] px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold"
                        >
                          {companies.map((co) => (
                            <option key={co.id} value={co.id}>
                              {co.name} ({co.batch_name})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div>
                          <h3 className="text-xl font-semibold text-neutral-950">
                            {selectedCompany.name}
                          </h3>
                          <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            كود الأسطول: {selectedCompany.batch_name} • عدد الكروت:{' '}
                            {currentCompanyCards.length}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          copyText(`${origin}/org/${selectedCompany.slug}`, 'co_portal')
                        }
                        className="min-h-[42px] px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'co_portal' ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
                        <span>نسخ رابط بوابة الشركة</span>
                      </button>
                      <a
                        href={`/org/${selectedCompany.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[42px] px-4 py-2 bg-[#181818] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <span>فتح البوابة المستقلة</span>
                        <ArrowUpLeftIcon size={14} />
                      </a>
                    </div>
                  </div>

                  {/* Add Employee Card Directly to Fleet */}
                  <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200">
                    <h4 className="text-sm font-semibold text-neutral-950 mb-3">
                      إصدار وإضافة كارت موظف جديد لأسطول ({selectedCompany.name})
                    </h4>
                    <form
                      onSubmit={(e) => handleCreateEmployeeCard(e, selectedCompany.id)}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      <input
                        type="text"
                        name="full_name"
                        required
                        placeholder="اسم الموظف الكامل"
                        className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        name="job_title"
                        placeholder="المسمى الوظيفي (مثال: Sales Manager)"
                        className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                      />
                      <input
                        type="tel"
                        name="phone"
                        dir="ltr"
                        placeholder="رقم الموبايل"
                        className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                      />
                      <input
                        type="email"
                        name="email"
                        dir="ltr"
                        placeholder="البريد الوظيفي (اختياري)"
                        className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                      />
                      <input
                        type="text"
                        name="linkedin"
                        dir="ltr"
                        placeholder="رابط LinkedIn (اختياري)"
                        className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="min-h-[44px] px-4 py-2 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs cursor-pointer"
                      >
                        {isPending ? 'جاري الإصدار...' : 'إصدار كارت الموظف فوراً'}
                      </button>
                    </form>
                  </div>

                  {/* Fleet Table */}
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-950 mb-3">
                      موظفو وكروت الأسطول ({currentCompanyCards.length})
                    </h4>
                    {currentCompanyCards.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-6 text-center">
                        لا توجد كروت مضافة لهذه الشركة بعد. أضف أول موظف من النموذج أعلاه.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-neutral-200 text-neutral-500">
                              <th className="py-3 pr-2">الكود</th>
                              <th className="py-3 px-2">الموظف</th>
                              <th className="py-3 px-2">المسمى</th>
                              <th className="py-3 px-2">المسحات</th>
                              <th className="py-3 px-2">Leads</th>
                              <th className="py-3 pl-2 text-left">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {currentCompanyCards.map((fc) => (
                              <tr key={fc.id}>
                                <td className="py-3 pr-2 font-mono font-semibold text-neutral-950">
                                  {fc.code}
                                </td>
                                <td className="py-3 px-2 font-semibold text-neutral-900">
                                  {fc.business_card?.full_name || 'غير معين'}
                                </td>
                                <td className="py-3 px-2 text-neutral-500">
                                  {fc.business_card?.job_title || '—'}
                                </td>
                                <td className="py-3 px-2 font-mono">{fc.scan_count || 0}</td>
                                <td className="py-3 px-2 font-mono font-semibold text-emerald-700">
                                  {fc.leads?.length || 0}
                                </td>
                                <td className="py-3 pl-2 text-left flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => copyText(`${origin}/q/${fc.code}`, fc.code)}
                                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium cursor-pointer"
                                  >
                                    {copiedKey === fc.code ? 'تم النسخ' : 'نسخ رابط NFC'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleCardSelect(fc.id);
                                      setActiveSection('cards');
                                    }}
                                    className="px-2.5 py-1.5 bg-[#181818] text-white rounded-lg font-medium cursor-pointer"
                                  >
                                    تحرير كامل
                                  </button>
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
          )}

          {/* ================= SECTION 4: LEADS CRM ================= */}
          {activeSection === 'leads' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950 mb-1">
                    سجل العملاء المتواصلين (CRM Leads)
                  </h2>
                  <p className="text-xs text-neutral-500">
                    كل شخص ترك اسمه ورقمه على كرتك الشخصي أو كروت موظفي شركتك ({allCombinedLeads.length})
                  </p>
                </div>
                {allCombinedLeads.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleExportLeads(allCombinedLeads)}
                    className="min-h-[42px] px-4 py-2 bg-[#181818] text-white font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    تصدير إلى شيت Excel (CSV)
                  </button>
                )}
              </div>

              {allCombinedLeads.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-12">
                  لا توجد جهات اتصال مسجلة حتى الآن.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500">
                        <th className="pb-3 pr-2">الكارت</th>
                        <th className="pb-3 px-2">اسم الزائر</th>
                        <th className="pb-3 px-2">رقم الموبايل</th>
                        <th className="pb-3 px-2">ملاحظة</th>
                        <th className="pb-3 pl-2 text-left">تواصل فوري</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {allCombinedLeads.map((lead) => {
                        const cleanWa = lead.visitor_phone.replace(/\D/g, '').replace(/^0/, '20');
                        return (
                          <tr key={lead.id}>
                            <td className="py-3.5 pr-2 font-mono font-semibold text-neutral-900">
                              {lead.ownerName}
                            </td>
                            <td className="py-3.5 px-2 font-semibold text-neutral-950">
                              {lead.visitor_name}
                            </td>
                            <td className="py-3.5 px-2 font-mono" dir="ltr">
                              {lead.visitor_phone}
                            </td>
                            <td className="py-3.5 px-2 text-neutral-500">
                              {lead.visitor_note || '—'}
                            </td>
                            <td className="py-3.5 pl-2 text-left">
                              <div className="inline-flex items-center gap-1.5">
                                <a
                                  href={`https://wa.me/${cleanWa}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold inline-flex items-center gap-1"
                                >
                                  <WhatsAppIcon size={13} />
                                  <span>واتساب</span>
                                </a>
                                <a
                                  href={`tel:${lead.visitor_phone}`}
                                  className="px-2.5 py-1.5 bg-neutral-100 text-neutral-800 rounded-lg font-semibold inline-flex items-center gap-1"
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
            </div>
          )}

          {/* ================= SECTION 5: CUSTODY, LOST MODE & OWNERSHIP ================= */}
          {activeSection === 'custody' && selectedCard && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">
                    إدارة الأمان، الفقدان، ونقل الملكية ({selectedCard.code})
                  </h2>
                  <p className="text-xs text-neutral-500">
                    تحكم كامل في حالة الشريحة أو انقل ملكيتها لعميل أو موظف آخر دون تغيير الكارت المطبوع.
                  </p>
                </div>
                <select
                  value={selectedCard.id}
                  onChange={(e) => handleCardSelect(e.target.value)}
                  className="min-h-[42px] px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-semibold"
                >
                  {allManageableCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.business_card?.full_name || c.product}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card Status Mode */}
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-950">
                    حالة البطاقة ووضع الفقدان (Lost Mode)
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    عند تفعيل وضع الفقدان، ستظهر رسالة تنبيه لمن يمسح الكارت للاتصال بك وإعادته.
                  </p>
                </div>
                <select
                  value={selectedCard.status}
                  onChange={(e) => handleStatusChange(e.target.value as CardStatus)}
                  className="min-h-[44px] px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold"
                >
                  <option value="active">نشط (Active)</option>
                  <option value="lost">مفقود — وضع الاسترداد (Lost Mode)</option>
                  <option value="suspended">موقوف مؤقتاً (Suspended)</option>
                </select>
              </div>

              {/* Direct Claim Link OR Email Ownership Transfer */}
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-950">
                      نقل ملكية الكارت لحساب عميل مستقل
                    </h4>
                    <p className="text-xs text-neutral-500">
                      انقل الملكية لبريد العميل المسجل، أو انسخ رابط الاستلام المباشر ليفعله العميل بنفسه.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(`${origin}/activate/${selectedCard.code}`, 'claim_link')}
                    className="min-h-[40px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'claim_link' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    <span>نسخ رابط استلام العميل</span>
                  </button>
                </div>

                <form onSubmit={handleTransferOwnership} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    placeholder="client@email.com"
                    className="flex-1 min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="min-h-[44px] px-5 py-2 bg-[#181818] text-white font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    نقل الملكية للبريد
                  </button>
                </form>
              </div>

              {/* Employee Custody Reassignment */}
              {selectedCard.product === 'business' && (
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-950">
                      إعادة تعيين عهدة الكارت لموظف جديد
                    </h4>
                    <p className="text-xs text-neutral-500">
                      يحتفظ الكارت بنفس كود الـ NFC المطبوع مع استبدال بيانات الموظف القديم بالجديد فوراً.
                    </p>
                  </div>
                  <form onSubmit={handleCustodyReassign} className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        name="full_name"
                        required
                        placeholder="اسم الموظف الجديد"
                        className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        name="job_title"
                        placeholder="المسمى الوظيفي"
                        className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                      />
                      <input
                        type="tel"
                        name="phone"
                        dir="ltr"
                        placeholder="رقم الموبايل"
                        className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="clear_leads"
                        className="rounded border-neutral-300"
                      />
                      <span className="text-xs font-medium text-red-700">
                        مسح سجل العملاء (Leads) السابق الخاص بالموظف المغادر
                      </span>
                    </label>
                    <div>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="min-h-[44px] px-5 py-2 bg-[#181818] text-white font-semibold rounded-xl text-xs cursor-pointer"
                      >
                        تحديث عهدة الموظف
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
