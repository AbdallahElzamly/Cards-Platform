'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/types/smart-cards';
import { activateCardAction } from '@/app/actions/cards';

interface ActivateCardClientProps {
  card: Card;
  code: string;
}

export default function ActivateCardClient({ card, code }: ActivateCardClientProps) {
  const router = useRouter();

  const [productType, setProductType] = useState<'business' | 'review'>(card.product === 'review' ? 'review' : 'business');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState(card.target_url || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً (الحد الأقصى 2 ميجابايت)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.set('code', code);
    formData.set('product_type', productType);
    if (avatarUrl) {
      formData.set('avatar_url', avatarUrl);
    }

    startTransition(async () => {
      const res = await activateCardAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'فشل تفعيل الكارت');
      } else {
        if (productType === 'business' && res.slug) {
          router.push(`/c/${res.slug}`);
        } else {
          router.push('/dashboard');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
            ⚡
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">تفعيل الكارت الذكي</h1>
          <p className="text-xs text-slate-500 font-mono">
            الكود: {code}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الكارت</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
            >
              <option value="business">كارت أعمال ذكي (Smart Business Card)</option>
              <option value="review">كارت تقييم جوجل (Google Review Card)</option>
            </select>
          </div>

          {productType === 'business' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكامل</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">المسمى الوظيفي</label>
                <input
                  type="text"
                  name="job_title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="مدير مبيعات"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الشركة / النشاط</label>
                <input
                  type="text"
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="شركة التقنية المتقدمة"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الموبايل</label>
                <input
                  type="tel"
                  name="phone"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none text-right font-mono"
                />
              </div>

              {/* Profile Photo / Avatar Support */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الصورة الشخصية / الشعار (Avatar)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full text-xs text-slate-500 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <input
                    type="url"
                    name="avatar_url"
                    dir="ltr"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="أو أدخل رابط صورة مباشر https://..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-right"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط تقييم جوجل (Google Maps Review URL)</label>
              <input
                type="url"
                name="target_url"
                required
                dir="ltr"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://g.page/r/..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none text-right font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition text-sm mt-2"
          >
            {isPending ? 'جاري التفعيل...' : 'تفعيل وربط الكارت 🚀'}
          </button>
        </form>

      </div>
    </div>
  );
}
