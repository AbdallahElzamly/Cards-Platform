'use client';

import React, { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { BusinessCard, CardSurfaceTheme, parseSocialLinks } from '@/types/smart-cards';
import { submitCardLeadAction } from '@/app/actions/leads';
import { useSearchParams } from 'next/navigation';
import {
  ArrowUpLeftIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  FacebookIcon,
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  QrCodeIcon,
  ShareIcon,
  TelegramIcon,
  TikTokIcon,
  UserPlusIcon,
  WalletIcon,
  WhatsAppIcon,
  XSocialIcon,
  YouTubeIcon,
} from '@/components/ui/Icons';

interface SmartBusinessCardClientProps {
  card: BusinessCard;
}

function getWhatsAppUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let cleaned = raw.replace(/\D/g, '');
  if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '20' + cleaned;
  }
  if (cleaned.length < 10) return null;
  return `https://wa.me/${cleaned}`;
}

const THEME_PALETTES: Record<
  CardSurfaceTheme,
  {
    pageBg: string;
    cardBg: string;
    cardBorder: string;
    tileBg: string;
    tileHover: string;
    tileBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    primaryBtnBg: string;
    primaryBtnText: string;
    badgeBg: string;
    badgeText: string;
    inputBg: string;
  }
> = {
  obsidian: {
    pageBg: 'bg-[#000000]',
    cardBg: 'bg-[#181818]',
    cardBorder: 'border-white/10',
    tileBg: 'bg-[#272727]',
    tileHover: 'hover:bg-[#313131]',
    tileBorder: 'border-white/10',
    textPrimary: 'text-white',
    textSecondary: 'text-neutral-300',
    textMuted: 'text-neutral-400',
    primaryBtnBg: 'bg-white hover:bg-neutral-200',
    primaryBtnText: 'text-neutral-950',
    badgeBg: 'bg-[#272727] border-white/10',
    badgeText: 'text-neutral-300',
    inputBg: 'bg-[#1F1F1F] border-white/10 text-white placeholder:text-neutral-500',
  },
  titanium: {
    pageBg: 'bg-[#181818]',
    cardBg: 'bg-[#1F1F1F]',
    cardBorder: 'border-white/12',
    tileBg: 'bg-[#272727]',
    tileHover: 'hover:bg-[#313131]',
    tileBorder: 'border-white/10',
    textPrimary: 'text-white',
    textSecondary: 'text-neutral-300',
    textMuted: 'text-neutral-400',
    primaryBtnBg: 'bg-white hover:bg-neutral-200',
    primaryBtnText: 'text-neutral-950',
    badgeBg: 'bg-[#272727] border-white/10',
    badgeText: 'text-neutral-300',
    inputBg: 'bg-[#181818] border-white/10 text-white placeholder:text-neutral-500',
  },
  pearl: {
    pageBg: 'bg-[#F3F4F6]',
    cardBg: 'bg-white',
    cardBorder: 'border-neutral-200',
    tileBg: 'bg-[#FAFAFA]',
    tileHover: 'hover:bg-neutral-100',
    tileBorder: 'border-neutral-200',
    textPrimary: 'text-neutral-950',
    textSecondary: 'text-neutral-700',
    textMuted: 'text-neutral-500',
    primaryBtnBg: 'bg-[#181818] hover:bg-neutral-800',
    primaryBtnText: 'text-white',
    badgeBg: 'bg-neutral-100 border-neutral-200',
    badgeText: 'text-neutral-700',
    inputBg: 'bg-white border-neutral-200 text-neutral-950 placeholder:text-neutral-400',
  },
  emerald: {
    pageBg: 'bg-[#000000]',
    cardBg: 'bg-[#181818]',
    cardBorder: 'border-emerald-500/20',
    tileBg: 'bg-[#272727]',
    tileHover: 'hover:bg-[#313131]',
    tileBorder: 'border-white/10',
    textPrimary: 'text-white',
    textSecondary: 'text-neutral-300',
    textMuted: 'text-emerald-400',
    primaryBtnBg: 'bg-emerald-500 hover:bg-emerald-400',
    primaryBtnText: 'text-neutral-950',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/25',
    badgeText: 'text-emerald-300',
    inputBg: 'bg-[#1F1F1F] border-white/10 text-white placeholder:text-neutral-500',
  },
  amber: {
    pageBg: 'bg-[#131209]',
    cardBg: 'bg-[#1F1F1F]',
    cardBorder: 'border-amber-500/20',
    tileBg: 'bg-[#272727]',
    tileHover: 'hover:bg-[#313131]',
    tileBorder: 'border-white/10',
    textPrimary: 'text-white',
    textSecondary: 'text-neutral-300',
    textMuted: 'text-amber-400',
    primaryBtnBg: 'bg-amber-400 hover:bg-amber-300',
    primaryBtnText: 'text-neutral-950',
    badgeBg: 'bg-amber-500/10 border-amber-500/25',
    badgeText: 'text-amber-300',
    inputBg: 'bg-[#181818] border-white/10 text-white placeholder:text-neutral-500',
  },
};

function SmartBusinessCardInner({ card }: SmartBusinessCardClientProps) {
  const searchParams = useSearchParams();
  const isLost = searchParams.get('lost') === 'true';

  const socials = parseSocialLinks(card.social_links);
  const themeKey: CardSurfaceTheme =
    socials.surface_theme && THEME_PALETTES[socials.surface_theme]
      ? socials.surface_theme
      : 'obsidian';
  const palette = THEME_PALETTES[themeKey];

  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorNote, setVisitorNote] = useState('');
  const [hpField, setHpField] = useState('');
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleFields = socials.visible_fields || {};
  const isFieldVisible = (key: string) => visibleFields[key] !== false;

  const phone1 = card.phone && isFieldVisible('phone') ? card.phone : null;
  const phone2 = socials.phone2 && isFieldVisible('phone2') ? String(socials.phone2) : null;
  const whatsappUrl = isFieldVisible('whatsapp')
    ? getWhatsAppUrl(card.whatsapp || card.phone)
    : null;

  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/c/${card.slug}`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'https://kuwi-liart.vercel.app'}/c/${card.slug}`;

  const copyValue = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: card.full_name,
          text: card.job_title ? `${card.full_name} — ${card.job_title}` : card.full_name,
          url: profileUrl,
        });
        return;
      } catch {
        // user dismissed native share sheet
      }
    }
    copyValue(profileUrl, 'share_url');
  };

  const handleLeadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!visitorName.trim() || !visitorPhone.trim()) return;

    const formData = new FormData();
    formData.set('business_card_id', card.id);
    formData.set('visitor_name', visitorName);
    formData.set('visitor_phone', visitorPhone);
    formData.set('visitor_note', visitorNote);
    formData.set('b_check', hpField);

    startTransition(async () => {
      const res = await submitCardLeadAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر إرسال البيانات');
      } else {
        setLeadSuccess(true);
        setVisitorName('');
        setVisitorPhone('');
        setVisitorNote('');
        setHpField('');
      }
    });
  };

  const socialItems = [
    {
      key: 'linkedin',
      label: 'لينكدإن',
      sub: 'LinkedIn',
      url: socials.linkedin,
      icon: <LinkedInIcon size={20} />,
    },
    {
      key: 'instagram',
      label: 'إنستجرام',
      sub: 'Instagram',
      url: socials.instagram,
      icon: <InstagramIcon size={20} />,
    },
    {
      key: 'facebook',
      label: 'فيسبوك',
      sub: 'Facebook',
      url: socials.facebook,
      icon: <FacebookIcon size={20} />,
    },
    {
      key: 'tiktok',
      label: 'تيك توك',
      sub: 'TikTok',
      url: socials.tiktok,
      icon: <TikTokIcon size={20} />,
    },
    {
      key: 'telegram',
      label: 'تيليجرام',
      sub: 'Telegram',
      url: socials.telegram,
      icon: <TelegramIcon size={20} />,
    },
    {
      key: 'x',
      label: 'منصة إكس',
      sub: 'X',
      url: socials.x,
      icon: <XSocialIcon size={20} />,
    },
    {
      key: 'youtube',
      label: 'يوتيوب',
      sub: 'YouTube',
      url: socials.youtube,
      icon: <YouTubeIcon size={20} />,
    },
    {
      key: 'github',
      label: 'جيت هاب',
      sub: 'GitHub',
      url: socials.github,
      icon: <GitHubIcon size={20} />,
    },
    {
      key: 'website',
      label: 'الموقع الإلكتروني',
      sub: 'Website',
      url: card.website || undefined,
      icon: <GlobeIcon size={20} />,
    },
    {
      key: 'location_url',
      label: 'الموقع على الخريطة',
      sub: 'Google Maps',
      url: socials.location_url,
      icon: <MapPinIcon size={20} />,
    },
    {
      key: 'custom_link_url',
      label: socials.custom_link_title || 'معرض الأعمال / السيرة الذاتية',
      sub: 'Portfolio',
      url: socials.custom_link_url,
      icon: <GlobeIcon size={20} />,
    },
  ].filter((item) => Boolean(item.url) && isFieldVisible(item.key));

  return (
    <div
      className={`min-h-screen ${palette.pageBg} flex flex-col items-center justify-start sm:justify-center py-4 px-3 sm:p-6 font-sans antialiased`}
      dir="rtl"
    >
      {/* Outer Card: rounded-3xl (24px), p-6 (24px) */}
      <main
        className={`w-full max-w-[420px] ${palette.cardBg} border ${palette.cardBorder} rounded-3xl p-6 flex flex-col gap-6 shadow-2xl`}
      >
        {/* Lost Mode Recovery Alert */}
        {isLost && (
          <div className="p-4 bg-amber-400 text-neutral-950 font-semibold rounded-2xl text-xs leading-relaxed text-center border border-amber-500">
            تنبيه: هذه البطاقة مبلغ عن فقدانها. إذا عثرت عليها، يرجى التواصل مباشرة مع صاحبها عبر الأزرار أدناه.
          </div>
        )}

        {/* Top Utility Bar */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${palette.badgeBg} ${palette.badgeText}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>KUWI NFC</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              aria-label="عرض رمز QR"
              className={`w-11 h-11 rounded-xl border ${palette.tileBorder} ${palette.tileBg} ${palette.tileHover} ${palette.textPrimary} flex items-center justify-center transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer`}
            >
              <QrCodeIcon size={18} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="مشاركة الكارت"
              className={`w-11 h-11 rounded-xl border ${palette.tileBorder} ${palette.tileBg} ${palette.tileHover} ${palette.textPrimary} flex items-center justify-center transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer`}
            >
              {copiedKey === 'share_url' ? <CheckIcon size={18} /> : <ShareIcon size={18} />}
            </button>
          </div>
        </div>

        {/* Executive Identity Header */}
        <section className="flex flex-col items-center text-center">
          <div
            className={`w-24 h-24 rounded-full border ${palette.cardBorder} ${palette.tileBg} overflow-hidden flex items-center justify-center text-2xl font-semibold ${palette.textPrimary} mb-4`}
          >
            {card.avatar_url && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{card.full_name ? card.full_name.trim().charAt(0).toUpperCase() : 'K'}</span>
            )}
          </div>

          <h1
            className={`text-2xl font-semibold ${palette.textPrimary} tracking-tight`}
            style={{ textWrap: 'balance' }}
          >
            {card.full_name}
          </h1>

          {(card.job_title || card.company) && (
            <p className={`text-sm font-medium ${palette.textMuted} mt-1`}>
              {[card.job_title, card.company].filter(Boolean).join(' • ')}
            </p>
          )}

          {card.bio && isFieldVisible('bio') && (
            <p
              className={`text-sm ${palette.textSecondary} mt-4 leading-relaxed max-w-[34ch]`}
              style={{ textWrap: 'pretty' }}
            >
              {card.bio}
            </p>
          )}
        </section>

        {/* Primary Conversion Action: Save Contact (.vcf) */}
        <div className="flex flex-col gap-3">
          <a
            href={`/api/vcard/${card.slug}`}
            className={`w-full min-h-[52px] py-3.5 px-4 ${palette.primaryBtnBg} ${palette.primaryBtnText} font-semibold rounded-2xl text-base flex items-center justify-center gap-2.5 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`}
          >
            <DownloadIcon size={19} />
            <span>حفظ جهة الاتصال</span>
          </a>

          {/* Direct Call / WhatsApp / Email Tactile Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {phone1 && (
              <a
                href={`tel:${phone1}`}
                className={`min-h-[48px] p-3 rounded-2xl border ${palette.tileBorder} ${palette.tileBg} ${palette.tileHover} ${palette.textPrimary} flex items-center justify-between transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`}
              >
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold">اتصال مباشر</span>
                  <span className={`text-xs font-mono ${palette.textMuted}`} dir="ltr">
                    {phone1}
                  </span>
                </div>
                <PhoneIcon size={18} className={palette.textMuted} />
              </a>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`min-h-[48px] p-3 rounded-2xl border ${palette.tileBorder} ${palette.tileBg} ${palette.tileHover} ${palette.textPrimary} flex items-center justify-between transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`}
              >
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold">واتساب</span>
                  <span className={`text-xs ${palette.textMuted}`}>محادثة فورية</span>
                </div>
                <WhatsAppIcon size={18} className="text-emerald-400" />
              </a>
            )}

            {phone2 && (
              <a
                href={`tel:${phone2}`}
                className={`min-h-[48px] p-3 rounded-2xl border ${palette.tileBorder} ${palette.tileBg} ${palette.tileHover} ${palette.textPrimary} flex items-center justify-between transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`}
              >
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold">الرقم الثاني</span>
                  <span className={`text-xs font-mono ${palette.textMuted}`} dir="ltr">
                    {phone2}
                  </span>
                </div>
                <PhoneIcon size={18} className={palette.textMuted} />
              </a>
            )}

            {card.email && isFieldVisible('email') && (
              <a
                href={`mailto:${card.email}`}
                className={`min-h-[48px] p-3 rounded-2xl border ${palette.tileBorder} ${palette.tileBg} ${palette.tileHover} ${palette.textPrimary} flex items-center justify-between transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`}
              >
                <div className="flex flex-col text-right overflow-hidden">
                  <span className="text-xs font-semibold">البريد الإلكتروني</span>
                  <span className={`text-xs font-mono truncate ${palette.textMuted}`} dir="ltr">
                    {card.email}
                  </span>
                </div>
                <MailIcon size={18} className={palette.textMuted} />
              </a>
            )}
          </div>
        </div>

        {/* Social & Professional Links List */}
        {socialItems.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className={`text-xs font-medium ${palette.textMuted} px-1`}>
              الحسابات والروابط الرسمية
            </h2>
            <div className="flex flex-col gap-2">
              {socialItems.map((item) => (
                <a
                  key={item.key}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-h-[52px] px-4 py-3 rounded-2xl border ${palette.tileBorder} ${palette.tileBg} ${palette.tileHover} ${palette.textPrimary} flex items-center justify-between transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`}
                >
                  <div className="flex items-center gap-3">
                    <span className={palette.textSecondary}>{item.icon}</span>
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className={`text-xs ${palette.textMuted}`}>{item.sub}</span>
                    </div>
                  </div>
                  <ArrowUpLeftIcon size={16} className={palette.textMuted} />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Digital Wallets & Fast Payments */}
        {((card.vodafone_cash && isFieldVisible('vodafone_cash')) ||
          (card.instapay_url && isFieldVisible('instapay'))) && (
          <section className="flex flex-col gap-2">
            <h2 className={`text-xs font-medium ${palette.textMuted} px-1`}>
              الدفع والتحويل السريع
            </h2>
            <div className="flex flex-col gap-2">
              {card.instapay_url && isFieldVisible('instapay') && (
                <a
                  href={card.instapay_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-h-[52px] px-4 py-3 rounded-2xl border ${palette.tileBorder} ${palette.tileBg} ${palette.tileHover} ${palette.textPrimary} flex items-center justify-between transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`}
                >
                  <div className="flex items-center gap-3">
                    <WalletIcon size={18} className={palette.textSecondary} />
                    <span className="text-sm font-medium">تحويل عبر InstaPay</span>
                  </div>
                  <ArrowUpLeftIcon size={16} className={palette.textMuted} />
                </a>
              )}

              {card.vodafone_cash && isFieldVisible('vodafone_cash') && (
                <button
                  type="button"
                  onClick={() => copyValue(card.vodafone_cash || '', 'vf_cash')}
                  className={`min-h-[52px] px-4 py-3 rounded-2xl border ${palette.tileBorder} ${palette.tileBg} ${palette.tileHover} ${palette.textPrimary} flex items-center justify-between transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <WalletIcon size={18} className={palette.textSecondary} />
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-medium">محفظة فودافون كاش</span>
                      <span className={`text-xs font-mono ${palette.textMuted}`} dir="ltr">
                        {card.vodafone_cash}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-1 ${palette.textSecondary}`}>
                    {copiedKey === 'vf_cash' ? (
                      <>
                        <CheckIcon size={15} />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon size={15} />
                        <span>نسخ</span>
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* Two-Way Lead Capture ("تبادل بياناتك معي") */}
        <section className={`rounded-2xl border ${palette.tileBorder} ${palette.tileBg} p-4`}>
          {!leadOpen && !leadSuccess ? (
            <button
              type="button"
              onClick={() => setLeadOpen(true)}
              className={`w-full min-h-[44px] flex items-center justify-between ${palette.textPrimary} cursor-pointer`}
            >
              <div className="flex items-center gap-2.5">
                <UserPlusIcon size={18} className={palette.textMuted} />
                <div className="text-right">
                  <div className="text-sm font-medium">شارك رقمك وبياناتك معي</div>
                  <div className={`text-xs ${palette.textMuted}`}>
                    اترك اسمك ورقمك للتواصل معك لاحقاً
                  </div>
                </div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${palette.cardBorder}`}>
                إرسال
              </span>
            </button>
          ) : leadSuccess ? (
            <div className="py-2 text-center">
              <p className={`text-sm font-medium ${palette.textPrimary}`}>
                تم إرسال بياناتك إلى {card.full_name} بنجاح.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${palette.textPrimary}`}>
                  أرسل بيانات الاتصال الخاصة بك
                </span>
                <button
                  type="button"
                  onClick={() => setLeadOpen(false)}
                  className={`p-1 ${palette.textMuted} cursor-pointer`}
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-xs text-center">
                  {errorMsg}
                </div>
              )}

              <input
                type="text"
                name="b_check"
                value={hpField}
                onChange={(e) => setHpField(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              <input
                type="text"
                required
                maxLength={80}
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="اسمك الكامل"
                className={`w-full min-h-[46px] px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none ${palette.inputBg}`}
              />
              <input
                type="tel"
                required
                maxLength={20}
                dir="ltr"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="رقم الموبايل (01xxxxxxxxx)"
                className={`w-full min-h-[46px] px-3.5 py-2.5 border rounded-xl text-sm font-mono text-right focus:outline-none ${palette.inputBg}`}
              />
              <input
                type="text"
                maxLength={500}
                value={visitorNote}
                onChange={(e) => setVisitorNote(e.target.value)}
                placeholder="الشركة أو ملاحظة قصيرة (اختياري)"
                className={`w-full min-h-[46px] px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none ${palette.inputBg}`}
              />
              <p className={`text-[11px] leading-relaxed ${palette.textMuted}`}>
                سيتم مشاركة اسمك ورقمك وملاحظتك مع صاحب هذه البطاقة للتواصل معك لاحقاً.
              </p>
              <button
                type="submit"
                disabled={isPending}
                className={`w-full min-h-[46px] py-2.5 ${palette.primaryBtnBg} ${palette.primaryBtnText} font-semibold rounded-xl text-sm transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer`}
              >
                {isPending ? 'جاري الحفظ...' : 'إرسال بياناتي الآن'}
              </button>
            </form>
          )}
        </section>

        {/* Subtle Brand Footer */}
        <footer className="pt-1 flex items-center justify-between text-xs">
          <span className={palette.textMuted}>مدعوم بواسطة KUWI</span>
          <Link
            href="/"
            className={`${palette.textSecondary} hover:underline font-medium`}
          >
            احصل على كرتك الذكي
          </Link>
        </footer>
      </main>

      {/* QR Code Share Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="w-full max-w-[340px] bg-white rounded-3xl p-6 text-center border border-neutral-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-neutral-950">امسح الرمز لفتح الكارت</span>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center cursor-pointer"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 inline-block mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
                  profileUrl
                )}`}
                alt={`QR ${card.full_name}`}
                width={220}
                height={220}
                className="rounded-xl mx-auto"
              />
            </div>

            <p className="text-sm font-semibold text-neutral-900 mb-1">{card.full_name}</p>
            <p className="text-xs text-neutral-500 font-mono truncate mb-4" dir="ltr">
              {profileUrl}
            </p>

            <button
              type="button"
              onClick={() => copyValue(profileUrl, 'modal_url')}
              className="w-full min-h-[46px] py-2.5 bg-[#181818] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedKey === 'modal_url' ? (
                <>
                  <CheckIcon size={16} />
                  <span>تم نسخ الرابط</span>
                </>
              ) : (
                <>
                  <CopyIcon size={16} />
                  <span>نسخ رابط الكارت</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SmartBusinessCardClient(props: SmartBusinessCardClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000000]" />}>
      <SmartBusinessCardInner {...props} />
    </Suspense>
  );
}
