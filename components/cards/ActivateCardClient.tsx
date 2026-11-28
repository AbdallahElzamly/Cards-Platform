'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessCard, Card, parseSocialLinks } from '@/types/smart-cards';
import { activateCardAction } from '@/app/actions/cards';
import { compressAvatarImage } from '@/lib/image-compress';

interface ActivateCardClientProps {
  card: Card;
  code: string;
  existingBusinessCard?: BusinessCard | null;
  currentUserEmail?: string | null;
}

export default function ActivateCardClient({
  card,
  code,
  existingBusinessCard,
  currentUserEmail,
}: ActivateCardClientProps) {
  const router = useRouter();
  const socials = parseSocialLinks(existingBusinessCard?.social_links);

  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');

  const [productType, setProductType] = useState<'business' | 'review'>(
    card.product === 'review' ? 'review' : 'business'
  );
  const [fullName, setFullName] = useState(existingBusinessCard?.full_name || '');
  const [jobTitle, setJobTitle] = useState(existingBusinessCard?.job_title || '');
  const [company, setCompany] = useState(existingBusinessCard?.company || '');
  const [phone, setPhone] = useState(existingBusinessCard?.phone || '');
  const [phone2, setPhone2] = useState(socials.phone2 || '');
  const [whatsapp, setWhatsapp] = useState(existingBusinessCard?.whatsapp || '');
  const [email, setEmail] = useState(existingBusinessCard?.email || '');
  const [linkedin, setLinkedin] = useState(socials.linkedin || '');
  const [instagram, setInstagram] = useState(socials.instagram || '');
  const [facebook, setFacebook] = useState(socials.facebook || '');
  const [avatarUrl, setAvatarUrl] = useState(existingBusinessCard?.avatar_url || '');
  const [targetUrl, setTargetUrl] = useState(card.target_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً، الحد الأقصى 10 ميجابايت.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);

    try {
      const compressed = await compressAvatarImage(file, 512, 0.82);

      if (currentUserEmail) {
        const uploadForm = new FormData();
        uploadForm.append(
          'file',
          new File([compressed.blob], `avatar-${card.id}.jpg`, { type: compressed.contentType })
        );
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
      }

      if (compressed.dataUrl.length <= 350_000) {
        setAvatarUrl(compressed.dataUrl);
      } else {
        setErrorMsg('تعذر ضغط الصورة بما يكفي، يرجى اختيار صورة أصغر.');
      }
    } catch {
      setErrorMsg('تعذر قراءة الصورة المختارة، يرجى تجربة صورة أخرى.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (uploadingAvatar) return;
    setErrorMsg(null);
    setInfoMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.set('code', code);
    formData.set('product_type', productType);
    formData.set('auth_mode', authMode);
    if (avatarUrl) {
      formData.set('avatar_url', avatarUrl);
    }

    startTransition(async () => {
      try {
        const res = await activateCardAction(formData);
        if (res.requiresEmailConfirmation) {
          setInfoMsg(
            res.message ||
              'بعتنالك رابط تأكيد على بريدك الإلكتروني — افتح الإيميل واضغط على الرابط لإكمال التفعيل.'
          );
          setAuthMode('signin');
          return;
        }
        if (!res.success) {
          setErrorMsg(res.error || 'تعذر تفعيل الكارت');
        } else {
          // Replace /activate/[code] in history and send owner directly to their Dashboard
          router.replace('/dashboard');
        }
      } catch {
        setErrorMsg('حدث خطأ مؤقت في الاتصال، يرجى الضغط على حفظ مرة أخرى.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-8 px-4 font-sans" dir="rtl">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-700 mb-3">
            <span>KUWI CARD</span>
            <span>•</span>
            <span>{code}</span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-950 mb-1">
            {existingBusinessCard ? 'استلام ملكية وتفعيل كرتك الذكي' : 'تفعيل كرتك الذكي في خطوة واحدة'}
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {existingBusinessCard
              ? 'بيانات كرتك جاهزة! أنشئ حسابك أدناه لربط الكارت ببريدك وتعديله بنفسك في أي وقت.'
              : 'أدخل بياناتك وأنشئ حسابك لتفعيل الكارت والتحكم فيه من لوحتك الخاصة فوراً.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-5 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="p-4 mb-5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl text-xs font-medium text-center leading-relaxed">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Step A: Inline Account Creation / Login when visitor is not signed in */}
          {!currentUserEmail ? (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">
                  1. حساب مالك الكارت (للتعديل لاحقاً)
                </span>
                <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-neutral-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                      authMode === 'signup' ? 'bg-[#181818] text-white' : 'text-neutral-600'
                    }`}
                  >
                    حساب جديد
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                      authMode === 'signin' ? 'bg-[#181818] text-white' : 'text-neutral-600'
                    }`}
                  >
                    لدي حساب
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    البريد الإلكتروني للحساب
                  </label>
                  <input
                    type="email"
                    name="account_email"
                    required
                    dir="ltr"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-mono text-left focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    name="account_password"
                    required
                    minLength={6}
                    dir="ltr"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="6 خانات على الأقل"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-mono text-left focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-medium">
              سيتم ربط ملكية هذا الكارت بحسابك الحالي ({currentUserEmail})
            </div>
          )}

          {/* Step B: Card Product Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              وظيفة الكارت
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as 'business' | 'review')}
              className="w-full min-h-[46px] px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-950 text-sm focus:outline-none focus:border-neutral-900"
            >
              <option value="business">كارت أعمال شخصي ذكي (Smart Business Card)</option>
              <option value="review">كارت تقييمات خرائط جوجل (Google Reviews)</option>
            </select>
          </div>

          {productType === 'business' ? (
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    الاسم الكامل الظاهر على الكارت
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: Eng. Ahmed Wasim"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    المسمى الوظيفي / التخصص
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Electrical Power Engineer"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    الشركة / الجهة
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="اسم الشركة أو الجامعة"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رقم الموبايل الأساسي
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="011xxxxxxxx"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-right focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رقم موبايل إضافي (اختياري)
                  </label>
                  <input
                    type="tel"
                    name="phone2"
                    dir="ltr"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-right focus:outline-none focus:border-neutral-900"
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
                    placeholder="011xxxxxxxx"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-right focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    البريد العام للكارت (اختياري)
                  </label>
                  <input
                    type="email"
                    name="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@domain.com"
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-right focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رابط LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    dir="ltr"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://www.linkedin.com/in/..."
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رابط Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    dir="ltr"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    رابط Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    dir="ltr"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Profile Photo */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  الصورة الشخصية أو الشعار (اختياري)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-neutral-500 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-900 hover:file:bg-neutral-200"
                />
                {uploadingAvatar && (
                  <p className="text-xs text-neutral-500 mt-1">جاري ضغط وتجهيز الصورة...</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                رابط تقييم النشاط على خرائط جوجل
              </label>
              <input
                type="url"
                name="target_url"
                required
                dir="ltr"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://g.page/r/..."
                className="w-full min-h-[46px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-950 text-sm font-mono text-left focus:outline-none focus:border-neutral-900"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || uploadingAvatar}
            className="w-full min-h-[50px] py-3.5 bg-[#181818] hover:bg-neutral-800 disabled:opacity-60 active:scale-[0.98] text-white font-semibold rounded-xl transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] text-sm cursor-pointer"
          >
            {uploadingAvatar
              ? 'جاري تجهيز الصورة...'
              : isPending
              ? 'جاري التفعيل وربط الكارت...'
              : 'حفظ وتفعيل الكارت الآن'}
          </button>
        </form>
      </div>
    </div>
  );
}
