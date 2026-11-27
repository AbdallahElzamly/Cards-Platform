'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CardSurfaceTheme } from '@/types/smart-cards';
import {
  claimCardByCodeInDashboardAction,
  createPersonalStarterCardAction,
} from '@/app/actions/dashboard';
import { merchantSignOutAction } from '@/app/actions/auth';
import {
  CheckIcon,
  CreditCardIcon,
  DownloadIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  PhoneIcon,
  SparklesIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';

interface IndividualOnboardingWizardProps {
  userEmail: string;
  defaultName?: string;
}

const PREVIEW_STYLES: Record<
  CardSurfaceTheme,
  { card: string; tile: string; text: string; muted: string; btn: string }
> = {
  obsidian: {
    card: 'bg-[#181818] border-white/10',
    tile: 'bg-[#272727] border-white/10',
    text: 'text-white',
    muted: 'text-neutral-400',
    btn: 'bg-white text-neutral-950',
  },
  titanium: {
    card: 'bg-[#1F1F1F] border-white/12',
    tile: 'bg-[#272727] border-white/10',
    text: 'text-white',
    muted: 'text-neutral-400',
    btn: 'bg-white text-neutral-950',
  },
  pearl: {
    card: 'bg-white border-neutral-200',
    tile: 'bg-[#FAFAFA] border-neutral-200',
    text: 'text-neutral-950',
    muted: 'text-neutral-500',
    btn: 'bg-[#181818] text-white',
  },
  emerald: {
    card: 'bg-[#181818] border-emerald-500/25',
    tile: 'bg-[#272727] border-white/10',
    text: 'text-white',
    muted: 'text-emerald-400',
    btn: 'bg-emerald-500 text-neutral-950',
  },
  amber: {
    card: 'bg-[#1F1F1F] border-amber-500/25',
    tile: 'bg-[#272727] border-white/10',
    text: 'text-white',
    muted: 'text-amber-400',
    btn: 'bg-amber-400 text-neutral-950',
  },
};

export default function IndividualOnboardingWizard({
  userEmail,
  defaultName = '',
}: IndividualOnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPhysicalCodeBox, setShowPhysicalCodeBox] = useState(false);
  const [physicalCode, setPhysicalCode] = useState('');

  // Step 1: Identity
  const [fullName, setFullName] = useState(defaultName);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');

  // Step 2: Direct Contact
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState(userEmail);

  // Step 3: Socials & Surface Theme
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [surfaceTheme, setSurfaceTheme] = useState<CardSurfaceTheme>('obsidian');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewPalette = PREVIEW_STYLES[surfaceTheme];

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setErrorMsg('يرجى كتابة اسمك الكامل للمتابعة.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleClaimPhysicalCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!physicalCode.trim()) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await claimCardByCodeInDashboardAction(physicalCode, {
        fullName,
        jobTitle,
        company,
        phone,
        whatsapp,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'تعذر ربط الكود، تأكد من صحته.');
      } else {
        router.refresh();
      }
    });
  };

  const handleFinishWizard = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setStep(1);
      setErrorMsg('يرجى كتابة اسمك الكامل.');
      return;
    }

    const formData = new FormData();
    formData.set('full_name', fullName);
    formData.set('job_title', jobTitle);
    formData.set('company', company);
    formData.set('bio', bio);
    formData.set('phone', phone);
    formData.set('phone2', phone2);
    formData.set('whatsapp', whatsapp);
    formData.set('email', email);
    formData.set('linkedin', linkedin);
    formData.set('instagram', instagram);
    formData.set('facebook', facebook);
    formData.set('surface_theme', surfaceTheme);

    startTransition(async () => {
      const res = await createPersonalStarterCardAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'حدث خطأ أثناء إنشاء بطاقتك.');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] font-sans antialiased py-6 px-4 sm:py-10 sm:px-6 pb-[env(safe-area-inset-bottom)]"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Clean Minimal Top Bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#181818] text-white font-bold text-sm flex items-center justify-center">
              K
            </span>
            <div>
              <span className="text-sm font-bold text-neutral-950 block">إعداد بطاقتك الذكية</span>
              <span className="text-xs text-neutral-400 font-mono">{userEmail}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPhysicalCodeBox((v) => !v)}
              className="min-h-[40px] px-3.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 flex items-center gap-1.5 transition cursor-pointer"
            >
              <CreditCardIcon size={15} />
              <span>معاك كارت NFC مطبوع؟</span>
            </button>

            <form action={merchantSignOutAction}>
              <button
                type="submit"
                className="text-xs font-medium text-neutral-400 hover:text-neutral-800 px-2 py-2 cursor-pointer"
              >
                خروج
              </button>
            </form>
          </div>
        </header>

        {/* Escape Hatch: Claim Printed 6-Char Physical Card Code */}
        {showPhysicalCodeBox && (
          <div className="bg-white p-5 rounded-3xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950 mb-0.5">
                ربط بطاقة NFC مطبوعة مسبقاً
              </h2>
              <p className="text-xs text-neutral-500">
                أدخل الكود المكون من 6 أحرف وأرقام الموجود على كرتك لفتح بياناته فوراً.
              </p>
            </div>
            <form onSubmit={handleClaimPhysicalCode} className="flex gap-2">
              <input
                type="text"
                dir="ltr"
                maxLength={10}
                value={physicalCode}
                onChange={(e) => setPhysicalCode(e.target.value)}
                placeholder="AW6E4K"
                className="w-36 min-h-[44px] px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono uppercase text-center focus:outline-none focus:border-neutral-900"
              />
              <button
                type="submit"
                disabled={isPending}
                className="min-h-[44px] px-5 py-2 bg-[#181818] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                تفعيل الكود
              </button>
            </form>
          </div>
        )}

        {/* Main Split Layout: Step-by-Step Questions + Live Card Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Right Column: Conversational 3-Step Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
            {/* 3-Segment Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-neutral-900">
                  <SparklesIcon size={15} />
                  <span>الخطوة {step} من 3</span>
                </span>
                <span>
                  {step === 1
                    ? 'الهوية المهنية'
                    : step === 2
                    ? 'أرقام التواصل'
                    : 'الحسابات والمظهر'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className={`h-1.5 rounded-full transition-colors duration-300 ${
                      n <= step ? 'bg-[#181818]' : 'bg-neutral-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 mb-5 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFinishWizard}>
              {/* STEP 1: IDENTITY */}
              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-neutral-950 mb-1">
                      أهلاً بك، لنجهّز هويتك على الكارت
                    </h1>
                    <p className="text-sm text-neutral-500">
                      أجب عن هذه الأسئلة السريعة لتظهر بطاقتك الرقمية بأفضل صورة أمام عملائك.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      ما اسمك الكامل كما تحب أن يظهر على الكارت؟ *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: م. أحمد وسيم / Eng. Ahmed Wasim"
                      className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-950 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        ما مسمّاك الوظيفي أو تخصصك؟
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="مهندس قوى كهربية / مؤسس"
                        className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-950 focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        الشركة أو الجهة أو الجامعة (اختياري)
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="اسم الشركة أو النشاط"
                        className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-950 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      نبذة تعريفية قصيرة تحت اسمك (اختياري)
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="سطر مختصر يوضح مجالك أو كيف تساعد من يتواصل معك..."
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-950 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full min-h-[50px] py-3 px-6 bg-[#181818] hover:bg-neutral-800 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition cursor-pointer"
                    >
                      التالي: أرقام التواصل ←
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CONTACT NUMBERS */}
              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-neutral-950 mb-1">
                      كيف يتواصل الناس معك بلمسة واحدة؟
                    </h2>
                    <p className="text-sm text-neutral-500">
                      تُحفظ هذه الأرقام مباشرة في هاتف من يمسح كرتك عند الضغط على «حفظ جهة الاتصال».
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        رقم الموبايل الأساسي
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="011xxxxxxxx"
                        className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        رقم موبايل ثانٍ إضافي (اختياري)
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={phone2}
                        onChange={(e) => setPhone2(e.target.value)}
                        placeholder="010xxxxxxxx"
                        className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-700">
                        رقم واتساب للمحادثة المباشرة
                      </label>
                      {phone && whatsapp !== phone && (
                        <button
                          type="button"
                          onClick={() => setWhatsapp(phone)}
                          className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                        >
                          استخدم نفس الرقم الأساسي
                        </button>
                      )}
                    </div>
                    <input
                      type="tel"
                      dir="ltr"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="011xxxxxxxx"
                      className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      البريد الإلكتروني الظاهر على الكارت (اختياري)
                    </label>
                    <input
                      type="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full min-h-[48px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-left focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="min-h-[50px] py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-xl text-sm transition cursor-pointer"
                    >
                      السابق
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="min-h-[50px] py-3 px-4 bg-[#181818] hover:bg-neutral-800 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition cursor-pointer"
                    >
                      التالي: الحسابات والمظهر ←
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SOCIALS & THEME */}
              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-neutral-950 mb-1">
                      روابط حساباتك ومظهر الكارت
                    </h2>
                    <p className="text-sm text-neutral-500">
                      أضف روابطك الاجتماعية واختر التصميم المناسب لك، ويمكنك تعديل كل شيء لاحقاً في أي وقت.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      رابط LinkedIn (اختياري)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://www.linkedin.com/in/..."
                      className="w-full min-h-[46px] px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        حساب Instagram (رابط أو @username)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@username"
                        className="w-full min-h-[46px] px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        رابط Facebook (اختياري)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="w-full min-h-[46px] px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-2">
                      اختر مظهر البطاقة
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
                              ? 'bg-[#181818] text-white border-[#181818]'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full shrink-0 ${t.dot}`} />
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="min-h-[50px] py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-xl text-sm transition cursor-pointer"
                    >
                      السابق
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="col-span-2 min-h-[50px] py-3 px-5 bg-[#181818] hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <CheckIcon size={17} />
                      <span>
                        {isPending ? 'جاري إصدار بطاقتك...' : 'إنشاء بطاقتي وفتح لوحة التحكم'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Left Column: Sticky Real-Time Mobile Preview */}
          <aside className="lg:col-span-5 lg:sticky lg:top-6">
            <div className="text-xs font-semibold text-neutral-500 mb-2 px-1">
              معاينة حية لشكل بطاقتك على الموبايل
            </div>
            <div
              className={`rounded-3xl border p-6 flex flex-col gap-5 shadow-xl transition-colors duration-300 ${previewPalette.card}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${previewPalette.muted}`}>KUWI NFC</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <div className="text-center">
                <div
                  className={`w-20 h-20 rounded-full border mx-auto mb-3 flex items-center justify-center text-2xl font-semibold ${previewPalette.tile} ${previewPalette.text}`}
                >
                  {fullName.trim() ? fullName.trim().charAt(0).toUpperCase() : 'K'}
                </div>
                <div className={`text-xl font-semibold ${previewPalette.text}`}>
                  {fullName.trim() || 'اسمك الكامل'}
                </div>
                <div className={`text-xs mt-1 ${previewPalette.muted}`}>
                  {[jobTitle.trim() || 'المسمى الوظيفي', company.trim()].filter(Boolean).join(' • ')}
                </div>
                {bio.trim() && (
                  <p className={`text-xs mt-3 leading-relaxed ${previewPalette.muted}`}>
                    {bio.trim()}
                  </p>
                )}
              </div>

              <div
                className={`min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${previewPalette.btn}`}
              >
                <DownloadIcon size={15} />
                <span>حفظ جهة الاتصال (.vcf)</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${previewPalette.tile} ${previewPalette.text}`}
                >
                  <span>{phone.trim() || 'اتصال مباشر'}</span>
                  <PhoneIcon size={14} className={previewPalette.muted} />
                </div>
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${previewPalette.tile} ${previewPalette.text}`}
                >
                  <span>واتساب</span>
                  <WhatsAppIcon size={14} className="text-emerald-400" />
                </div>
              </div>

              {(linkedin.trim() || instagram.trim() || facebook.trim()) && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  {linkedin.trim() && <LinkedInIcon size={17} className={previewPalette.text} />}
                  {instagram.trim() && <InstagramIcon size={17} className={previewPalette.text} />}
                  {facebook.trim() && <FacebookIcon size={17} className={previewPalette.text} />}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
