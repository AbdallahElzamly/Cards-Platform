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
  reassignCardCustodyAction,
  updateBusinessCardAction,
  updateCardStatusModeAction,
  updateReviewCardTargetUrlAction,
} from '@/app/actions/dashboard';
import { merchantSignOutAction } from '@/app/actions/auth';
import { compressAvatarImage } from '@/lib/image-compress';
import IndividualOnboardingWizard from './IndividualOnboardingWizard';
import {
  ArrowUpLeftIcon,
  BuildingIcon,
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  DownloadIcon,
  PhoneIcon,
  QrCodeIcon,
  ShieldIcon,
  UsersIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';

interface UnifiedClientDashboardProps {
  cards: CardWithDetails[];
  companies: Company[];
  fleetCards: CardWithDetails[];
  loyaltyProgram: { business_name?: string } | null;
  userEmail: string;
  defaultDisplayName?: string;
  isSuperAdmin: boolean;
}

type SectionKey = 'my_card' | 'share_qr' | 'leads' | 'privacy_security' | 'companies';

export default function UnifiedClientDashboard({
  cards,
  companies,
  fleetCards,
  loyaltyProgram,
  userEmail,
  defaultDisplayName = '',
  isSuperAdmin,
}: UnifiedClientDashboardProps) {
  const router = useRouter();

  const hasFleetAccess = isSuperAdmin || companies.length > 0;
  const hasLoyaltyAccess = isSuperAdmin || Boolean(loyaltyProgram);
  const isZeroCardIndividual =
    cards.length === 0 && !hasFleetAccess && !hasLoyaltyAccess && !isSuperAdmin;

  const allManageableCards = Array.from(
    new Map([...cards, ...fleetCards].map((c) => [c.id, c])).values()
  );

  const [activeSection, setActiveSection] = useState<SectionKey>(
    cards.length === 0 && companies.length > 0 ? 'companies' : 'my_card'
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

  // Immediately launch Guided 3-Step Onboarding Wizard for new Individual accounts with 0 cards
  if (isZeroCardIndividual) {
    return (
      <IndividualOnboardingWizard
        userEmail={userEmail}
        defaultName={defaultDisplayName}
      />
    );
  }

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

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً، الحد الأقصى 10 ميجابايت.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Layer 1: Compress image in browser to crisp 512x512 JPEG (~40-80 KB)
      const compressed = await compressAvatarImage(file, 512, 0.82);

      // Layer 2: Upload via authenticated server Route Handler to Supabase Storage (avatars bucket)
      const uploadForm = new FormData();
      uploadForm.append(
        'file',
        new File([compressed.blob], `avatar-${selectedCard?.id || 'profile'}.jpg`, {
          type: compressed.contentType,
        })
      );
      if (selectedCard?.id) {
        uploadForm.append('cardId', selectedCard.id);
      }

      const resp = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: uploadForm,
      });

      if (resp.ok) {
        const json = (await resp.json()) as { success?: boolean; url?: string };
        if (json.url) {
          setAvatarUrl(json.url);
          return;
        }
      }

      // Layer 3: Safe fallback to tiny compressed DataURL (~50 KB, never > 350 KB)
      if (compressed.dataUrl.length <= 350_000) {
        setAvatarUrl(compressed.dataUrl);
      } else {
        setErrorMsg('تعذر رفع الصورة للخادم، يرجى اختيار صورة أصغر والمحاولة مجدداً.');
      }
    } catch (err) {
      console.error('handleImageFileChange error:', err);
      setErrorMsg('تعذر معالجة الصورة المختارة، يرجى تجربة صورة أخرى (JPG أو PNG).');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBusinessSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard || uploadingAvatar) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.set('avatar_url', avatarUrl);
    formData.set('surface_theme', surfaceTheme);

    const updatedSocials = {
      surface_theme: surfaceTheme,
      visible_fields: visibleFields,
    };
    formData.set('social_links_json', JSON.stringify(updatedSocials));

    startTransition(async () => {
      try {
        const res = await updateBusinessCardAction(selectedCard.id, formData);
        if (!res.success) {
          setErrorMsg(res.error || 'تعذر حفظ التعديلات.');
        } else {
          setSuccessMsg('تم حفظ وتحديث بيانات بطاقتك بنجاح.');
          router.refresh();
        }
      } catch (err) {
        console.error('handleBusinessSubmit network/server error:', err);
        setErrorMsg('حدث خطأ مؤقت في الاتصال أثناء الحفظ. تأكد من الإنترنت واضغط حفظ مرة أخرى.');
      }
    });
  };

  const handleClaimCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCodeInput.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = await claimCardByCodeInDashboardAction(claimCodeInput);
        if (!res.success) {
          setErrorMsg(res.error || 'تعذر تفعيل الكارت.');
        } else {
          setSuccessMsg(`تم ربط الكارت (${claimCodeInput.toUpperCase()}) بحسابك بنجاح.`);
          setClaimCodeInput('');
          router.refresh();
        }
      } catch (err) {
        console.error('handleClaimCard error:', err);
        setErrorMsg('حدث خطأ أثناء تفعيل الكارت، يرجى المحاولة مرة أخرى.');
      }
    });
  };

  const handleStatusChange = (status: CardStatus) => {
    if (!selectedCard) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      try {
        const res = await updateCardStatusModeAction(selectedCard.id, status);
        if (!res.success) {
          setErrorMsg(res.error || 'تعذر تحديث الحالة.');
        } else {
          setSuccessMsg(
            status === 'lost'
              ? 'تم تفعيل وضع المفقود — سيظهر تنبيه استرداد لأي شخص يمسح البطاقة.'
              : 'تم إعادة البطاقة إلى الوضع النشط.'
          );
          router.refresh();
        }
      } catch (err) {
        console.error('handleStatusChange error:', err);
        setErrorMsg('حدث خطأ أثناء تحديث حالة البطاقة.');
      }
    });
  };

  const handleCustodyReassign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    const formData = new FormData(e.currentTarget);
    const clearLeads = formData.get('clear_leads') === 'on';

    startTransition(async () => {
      try {
        const res = await reassignCardCustodyAction(selectedCard.id, formData, clearLeads);
        if (!res.success) {
          setErrorMsg(res.error || 'تعذر تحديث عهدة الموظف.');
        } else {
          setSuccessMsg('تم تحديث بيانات الموظف وعهدة الكارت بنجاح.');
          router.refresh();
        }
      } catch (err) {
        console.error('handleCustodyReassign error:', err);
        setErrorMsg('حدث خطأ أثناء تحديث العهدة.');
      }
    });
  };

  const handleReviewUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) return;
    const formData = new FormData(e.currentTarget);
    const targetUrl = formData.get('target_url')?.toString() || '';

    startTransition(async () => {
      try {
        const res = await updateReviewCardTargetUrlAction(selectedCard.id, targetUrl);
        if (!res.success) {
          setErrorMsg(res.error || 'تعذر حفظ الرابط.');
        } else {
          setSuccessMsg('تم حفظ رابط التقييم بنجاح.');
          router.refresh();
        }
      } catch (err) {
        console.error('handleReviewUrlSubmit error:', err);
        setErrorMsg('حدث خطأ أثناء حفظ رابط التقييم.');
      }
    });
  };

  const allCombinedLeads = allManageableCards.flatMap((c) =>
    (c.leads || []).map((l) => ({
      ...l,
      cardCode: c.code,
      ownerName: c.business_card?.full_name || c.code,
    }))
  );

  const handleExportLeads = () => {
    const headers = ['card_code', 'card_owner', 'visitor_name', 'visitor_phone', 'visitor_note', 'created_at'];
    const rows = allCombinedLeads.map((l) => [
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
    link.download = 'kuwi-contacts.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalScans = allManageableCards.reduce((acc, c) => acc + (c.scan_count || 0), 0);
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;
  const currentCompanyCards = selectedCompany
    ? fleetCards.filter((c) => c.batch_name === selectedCompany.batch_name)
    : [];

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://kuwi-liart.vercel.app';

  const navItems: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    {
      id: 'my_card',
      label: allManageableCards.length > 1 ? `بطاقاتي وتعديل البيانات (${allManageableCards.length})` : 'بطاقتي وتعديل البيانات',
      icon: <CreditCardIcon size={17} />,
    },
    {
      id: 'share_qr',
      label: 'رمز الـ QR والمشاركة',
      icon: <QrCodeIcon size={17} />,
    },
    {
      id: 'leads',
      label: `من تواصل معي (${allCombinedLeads.length})`,
      icon: <UsersIcon size={17} />,
    },
    {
      id: 'privacy_security',
      label: 'الخصوصية ووضع الفقدان',
      icon: <ShieldIcon size={17} />,
    },
  ];

  // Strictly show Company Fleet tab ONLY to authorized Fleet Managers or Super Admin
  if (hasFleetAccess) {
    navItems.push({
      id: 'companies',
      label: `أسطول الشركة (${companies.length})`,
      icon: <BuildingIcon size={17} />,
    });
  }

  const cardPublicUrl = selectedCard?.business_card?.slug
    ? `${origin}/c/${selectedCard.business_card.slug}`
    : `${origin}/q/${selectedCard?.code || ''}`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans antialiased" dir="rtl">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Clean Role-Isolated Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 flex flex-col justify-between gap-6 lg:sticky lg:top-6">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#181818] text-white font-bold text-sm flex items-center justify-center">
                  K
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-neutral-950 truncate">
                    {selectedCard?.business_card?.full_name || 'بطاقتي الذكية'}
                  </div>
                  <div className="text-xs text-neutral-400 font-mono truncate">{userEmail}</div>
                </div>
              </div>

              {/* Compact Personal Stats Pill */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 text-center">
                <div>
                  <div className="text-base font-semibold font-mono text-neutral-950">
                    {totalScans}
                  </div>
                  <div className="text-[11px] text-neutral-500">زيارة للكارت</div>
                </div>
                <div className="border-r border-neutral-200">
                  <div className="text-base font-semibold font-mono text-emerald-700">
                    {allCombinedLeads.length}
                  </div>
                  <div className="text-[11px] text-neutral-500">تواصل معك</div>
                </div>
              </div>

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
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
              {/* Strictly render Restaurant Loyalty ONLY if user owns an active loyalty program or is Super Admin */}
              {hasLoyaltyAccess && (
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
              )}

              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="min-h-[42px] px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 font-semibold rounded-xl text-xs flex items-center justify-between transition"
                >
                  <span>مركز المشرف (Admin)</span>
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

        {/* Main Content */}
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

          {/* Top Bar for Quick Live Card Preview & Selector (when user owns multiple physical cards) */}
          {selectedCard && activeSection !== 'companies' && (
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {allManageableCards.length > 1 ? (
                <div className="flex-1">
                  <select
                    value={selectedCard.id}
                    onChange={(e) => handleCardSelect(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-semibold"
                  >
                    {allManageableCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.business_card?.full_name || c.product}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-neutral-400 block">رابط بطاقتك الرقمية النشطة</span>
                  <span className="text-xs font-mono text-neutral-800" dir="ltr">
                    {cardPublicUrl}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyText(cardPublicUrl, 'top_copy')}
                  className="min-h-[42px] px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'top_copy' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                  <span>{copiedKey === 'top_copy' ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
                {selectedCard.business_card?.slug && (
                  <Link
                    href={`/c/${selectedCard.business_card.slug}`}
                    target="_blank"
                    className="min-h-[42px] px-4 py-2 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <span>معاينة بطاقتي</span>
                    <ArrowUpLeftIcon size={14} />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ================= FALLBACK WIZARD WHEN USER HAS 0 CARDS ================= */}
          {!selectedCard && activeSection !== 'companies' && activeSection !== 'leads' && (
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
              <IndividualOnboardingWizard
                userEmail={userEmail}
                defaultName={defaultDisplayName}
              />
            </div>
          )}

          {/* ================= TAB 1: MY CARD EDITOR ================= */}
          {activeSection === 'my_card' && selectedCard && (
            <>
              {selectedCard.product === 'business' ? (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col gap-6">
                  <div>
                    <h1 className="text-lg font-semibold text-neutral-950 mb-1">
                      تعديل بيانات بطاقتك الشخصية
                    </h1>
                    <p className="text-xs text-neutral-500">
                      أي تعديل تحفظه هنا يظهر في نفس اللحظة لكل من يمسح بطاقتك أو يفتح رابطك.
                    </p>
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
                        {(
                          [
                            { id: 'obsidian', label: 'أسود فخم', dot: 'bg-[#181818]' },
                            { id: 'titanium', label: 'معدني', dot: 'bg-[#313131]' },
                            { id: 'pearl', label: 'أبيض نقي', dot: 'bg-white border border-neutral-300' },
                            { id: 'emerald', label: 'زمردي', dot: 'bg-emerald-500' },
                            { id: 'amber', label: 'ذهبي', dot: 'bg-amber-500' },
                          ] as const
                        ).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSurfaceTheme(t.id)}
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

                    {/* Core Identity & Phones */}
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
                          className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          الموقع الإلكتروني (اختياري)
                        </label>
                        <input
                          type="text"
                          name="website"
                          dir="ltr"
                          defaultValue={selectedCard.business_card?.website || ''}
                          className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          نبذة تعريفية قصيرة
                        </label>
                        <textarea
                          name="bio"
                          rows={2}
                          defaultValue={selectedCard.business_card?.bio || ''}
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Social Accounts */}
                    <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <h3 className="text-sm font-semibold text-neutral-950">
                          حسابات التواصل والروابط المهنية
                        </h3>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          LinkedIn
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
                          Instagram
                        </label>
                        <input
                          type="text"
                          name="instagram"
                          dir="ltr"
                          defaultValue={selectedSocials.instagram || ''}
                          placeholder="@username أو الرابط"
                          className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Facebook
                        </label>
                        <input
                          type="text"
                          name="facebook"
                          dir="ltr"
                          defaultValue={selectedSocials.facebook || ''}
                          placeholder="https://facebook.com/..."
                          className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          TikTok
                        </label>
                        <input
                          type="text"
                          name="tiktok"
                          dir="ltr"
                          defaultValue={selectedSocials.tiktok || ''}
                          placeholder="@username"
                          className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Telegram
                        </label>
                        <input
                          type="text"
                          name="telegram"
                          dir="ltr"
                          defaultValue={selectedSocials.telegram || ''}
                          placeholder="@username"
                          className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          موقع الخريطة (Google Maps)
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
                          عنوان رابط إضافي (مثل السيرة الذاتية CV)
                        </label>
                        <input
                          type="text"
                          name="custom_link_title"
                          defaultValue={selectedSocials.custom_link_title || ''}
                          placeholder="السيرة الذاتية / معرض الأعمال"
                          className="w-full min-h-[44px] px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          الرابط الإضافي
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

                    {/* Wallets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          محفظة فودافون كاش (اختياري)
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
                          رابط انستاباي InstaPay (اختياري)
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

                    {/* Avatar */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        الصورة الشخصية
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
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setAvatarUrl('')}
                              className="self-start text-[11px] font-semibold text-red-700 hover:text-red-800 cursor-pointer"
                            >
                              حذف الصورة الحالية
                            </button>
                          )}
                        </div>
                      </div>
                      {uploadingAvatar && (
                        <p className="text-xs text-neutral-500 mt-1">جاري ضغط ورفع الصورة...</p>
                      )}
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isPending || uploadingAvatar}
                        className="min-h-[48px] py-3 px-8 bg-[#181818] hover:bg-neutral-800 disabled:opacity-60 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition cursor-pointer"
                      >
                        {uploadingAvatar
                          ? 'جاري رفع الصورة...'
                          : isPending
                          ? 'جاري الحفظ...'
                          : 'حفظ التعديلات'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200">
                  <h2 className="text-base font-semibold text-neutral-950 mb-4">
                    تعديل رابط تقييمات جوجل
                  </h2>
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

          {/* ================= TAB 2: QR CODE, VCARD & PHYSICAL CARD LINKING ================= */}
          {activeSection === 'share_qr' && selectedCard && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col items-center text-center gap-4">
                <h2 className="text-lg font-semibold text-neutral-950">
                  رمز الـ QR الخاص ببطاقتك
                </h2>
                <p className="text-xs text-neutral-500">
                  اعرض هذا الرمز لأي شخص ليمسحه بكاميرا هاتفه ويحفظ بياناتك فوراً.
                </p>

                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
                      cardPublicUrl
                    )}`}
                    alt="Card QR"
                    width={210}
                    height={210}
                    className="rounded-xl"
                  />
                </div>

                <div className="w-full flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => copyText(cardPublicUrl, 'qr_copy')}
                    className="w-full min-h-[46px] py-2.5 px-4 bg-[#181818] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedKey === 'qr_copy' ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
                    <span>نسخ رابط البطاقة</span>
                  </button>

                  {selectedCard.business_card?.slug && (
                    <a
                      href={`/api/vcard/${selectedCard.business_card.slug}`}
                      className="w-full min-h-[46px] py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
                    >
                      <DownloadIcon size={15} />
                      <span>تجربة تحميل ملف جهة الاتصال (.vcf)</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col justify-between gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950 mb-1.5">
                    ربط بطاقة NFC مطبوعة إضافية
                  </h2>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    إذا اشتريت بطاقة NFC فعلية مطبوعة، أدخل الكود المطبوع عليها لربطها بحسابك هنا.
                  </p>
                </div>

                <form onSubmit={handleClaimCard} className="flex flex-col gap-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={claimCodeInput}
                    onChange={(e) => setClaimCodeInput(e.target.value)}
                    placeholder="أدخل الكود (مثال: AW6E4K)"
                    className="w-full min-h-[48px] px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono uppercase text-center"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full min-h-[48px] py-2.5 bg-[#181818] hover:bg-neutral-800 text-white font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    تفعيل وربط الكارت المطبوع
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================= TAB 3: LEADS (WHO CONTACTED ME) ================= */}
          {activeSection === 'leads' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950 mb-1">
                    الأشخاص الذين شاركوا أرقامهم معك ({allCombinedLeads.length})
                  </h2>
                  <p className="text-xs text-neutral-500">
                    يظهر هنا كل زائر ترك اسمه ورقمه من خلال نموذج «شارك رقمك معي» على بطاقتك.
                  </p>
                </div>
                {allCombinedLeads.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportLeads}
                    className="min-h-[42px] px-4 py-2 bg-[#181818] text-white font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    تنزيل ملف Excel (CSV)
                  </button>
                )}
              </div>

              {allCombinedLeads.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-12">
                  لم يرسل أحد بياناته بعد. شارك رابط بطاقتك ليبدأ الزوار في ترك بياناتهم لك.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500">
                        <th className="pb-3 pr-2">الاسم</th>
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
                            <td className="py-3.5 pr-2 font-semibold text-neutral-950">
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

          {/* ================= TAB 4: PRIVACY & LOST CARD MODE (PURE INDIVIDUAL) ================= */}
          {activeSection === 'privacy_security' && selectedCard && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950 mb-1">
                  الخصوصية وحماية البطاقة من الفقدان
                </h2>
                <p className="text-xs text-neutral-500">
                  تحكم فيما يظهر على بطاقتك العامة، أو فعّل وضع الاسترداد إذا نسيت أو فقدت بطاقتك المطبوعة.
                </p>
              </div>

              {/* Lost Card Mode */}
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950">
                    وضع البطاقة المفقودة (Lost Mode)
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    عند التفعيل، يظهر تنبيه واضح لأي شخص يمسح البطاقة للاتصال بك وتسليمها لك.
                  </p>
                </div>
                <select
                  value={selectedCard.status === 'lost' ? 'lost' : 'active'}
                  onChange={(e) => handleStatusChange(e.target.value as CardStatus)}
                  disabled={selectedCard.status === 'suspended' && !isSuperAdmin}
                  className="min-h-[44px] px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold"
                >
                  <option value="active">نشطة بشكل طبيعي</option>
                  <option value="lost">مفقودة — إظهار تنبيه الاسترداد</option>
                </select>
              </div>

              {/* Privacy Presets & Checkboxes */}
              <form onSubmit={handleBusinessSubmit} className="flex flex-col gap-4">
                <input
                  type="hidden"
                  name="full_name"
                  value={selectedCard.business_card?.full_name || 'بطاقتي'}
                />
                <input
                  type="hidden"
                  name="job_title"
                  value={selectedCard.business_card?.job_title || ''}
                />
                <input
                  type="hidden"
                  name="company"
                  value={selectedCard.business_card?.company || ''}
                />
                <input
                  type="hidden"
                  name="bio"
                  value={selectedCard.business_card?.bio || ''}
                />
                <input
                  type="hidden"
                  name="phone"
                  value={selectedCard.business_card?.phone || ''}
                />
                <input
                  type="hidden"
                  name="whatsapp"
                  value={selectedCard.business_card?.whatsapp || ''}
                />
                <input
                  type="hidden"
                  name="email"
                  value={selectedCard.business_card?.email || ''}
                />
                <input
                  type="hidden"
                  name="website"
                  value={selectedCard.business_card?.website || ''}
                />
                <input
                  type="hidden"
                  name="vodafone_cash"
                  value={selectedCard.business_card?.vodafone_cash || ''}
                />
                <input
                  type="hidden"
                  name="instapay_url"
                  value={selectedCard.business_card?.instapay_url || ''}
                />

                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      إظهار أو إخفاء الحقول على البطاقة
                    </h3>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 text-xs">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('all')}
                        className="px-2.5 py-1 rounded-lg font-semibold text-neutral-800 hover:bg-neutral-100 cursor-pointer"
                      >
                        إظهار الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('work')}
                        className="px-2.5 py-1 rounded-lg font-semibold text-neutral-800 hover:bg-neutral-100 cursor-pointer"
                      >
                        وضع العمل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('social_pay')}
                        className="px-2.5 py-1 rounded-lg font-semibold text-neutral-800 hover:bg-neutral-100 cursor-pointer"
                      >
                        الدفع السريع
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'phone', label: 'الرقم الأساسي' },
                      { key: 'phone2', label: 'الرقم الثاني' },
                      { key: 'whatsapp', label: 'واتساب' },
                      { key: 'email', label: 'البريد' },
                      { key: 'linkedin', label: 'لينكدإن' },
                      { key: 'instagram', label: 'إنستجرام' },
                      { key: 'facebook', label: 'فيسبوك' },
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
                    className="min-h-[46px] py-2.5 px-6 bg-[#181818] text-white font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    {isPending ? 'جاري حفظ الخصوصية...' : 'حفظ إعدادات الخصوصية'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= TAB 5: AUTHORIZED COMPANY FLEET ONLY (ZERO SELF-MINTING) ================= */}
          {activeSection === 'companies' && hasFleetAccess && selectedCompany && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
                <div>
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
                    <>
                      <h2 className="text-xl font-semibold text-neutral-950">
                        {selectedCompany.name}
                      </h2>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">
                        دفعة الأسطول المعتمدة: {selectedCompany.batch_name} • الكروت المخصصة:{' '}
                        {currentCompanyCards.length}
                      </p>
                    </>
                  )}
                </div>

                <Link
                  href={`/org/${selectedCompany.slug}`}
                  className="min-h-[42px] px-4 py-2 bg-[#181818] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5"
                >
                  <span>فتح بوابة إدارة عهدة الموظفين</span>
                  <ArrowUpLeftIcon size={14} />
                </Link>
              </div>

              {selectedCard && (
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200">
                  <h3 className="text-sm font-semibold text-neutral-950 mb-3">
                    نقل وتحديث عهدة كارت ({selectedCard.code}) لموظف
                  </h3>
                  <form onSubmit={handleCustodyReassign} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      name="full_name"
                      required
                      defaultValue={selectedCard.business_card?.full_name || ''}
                      placeholder="اسم الموظف"
                      className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      name="job_title"
                      defaultValue={selectedCard.business_card?.job_title || ''}
                      placeholder="المسمى الوظيفي"
                      className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                    />
                    <input
                      type="tel"
                      name="phone"
                      dir="ltr"
                      defaultValue={selectedCard.business_card?.phone || ''}
                      placeholder="رقم الموبايل"
                      className="min-h-[44px] px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-left"
                    />
                    <label className="sm:col-span-2 flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="clear_leads" className="rounded border-neutral-300" />
                      <span className="text-xs text-red-700 font-medium">
                        مسح سجل العملاء السابق عند نقل الكارت لموظف جديد
                      </span>
                    </label>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="min-h-[44px] px-4 py-2 bg-[#181818] text-white font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      حفظ عهدة الموظف
                    </button>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500">
                      <th className="py-3 pr-2">الكود</th>
                      <th className="py-3 px-2">الموظف الحالي</th>
                      <th className="py-3 px-2">المسحات</th>
                      <th className="py-3 px-2">Leads</th>
                      <th className="py-3 pl-2 text-left">تعديل</th>
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
                        <td className="py-3 px-2 font-mono">{fc.scan_count || 0}</td>
                        <td className="py-3 px-2 font-mono font-semibold text-emerald-700">
                          {fc.leads?.length || 0}
                        </td>
                        <td className="py-3 pl-2 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              handleCardSelect(fc.id);
                              setActiveSection('my_card');
                            }}
                            className="px-3 py-1.5 bg-[#181818] text-white rounded-lg font-medium cursor-pointer"
                          >
                            تحرير بياناته
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
