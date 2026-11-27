import type { Metadata } from 'next';
import Link from 'next/link';
import { getKuwiOrderHref } from '@/lib/brand-config';
import {
  ArrowUpLeftIcon,
  CheckIcon,
  ShieldIcon,
  SparklesIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'نظام ولاء المطاعم والكافيهات + المنيو الذكي من KUWI — رجّع زبونك 6 مرات بدل ما يمشي',
  description:
    'كروت KUWI الذكية للطاولات والكاشير (NFC + QR): جمع أرقام زباينك بذكاء، امنحهم أختام ولاء بكود الكاشير اليومي، وحوّلهم أوتوماتيك على المنيو الرقمي بعد تسجيل الزيارة.',
};

export default function RestaurantsLandingPage() {
  const orderBranch = getKuwiOrderHref(
    'أهلاً فريق KUWI، عايز أفعّل نظام ولاء المطاعم + المنيو الذكي لفرع واحد (كروت طاولات مبرمجة + لوحة الكاشير وRetention).',
    'طلب نظام ولاء المطاعم — باقة الفرع الواحد'
  );
  const orderGrowth = getKuwiOrderHref(
    'أهلاً فريق KUWI، عايز باقة النمو للمطاعم والكافيهات (20 كارت KUWI للطاولات والكاشير + نظام الولاء والمنيو + 3 كروت تقييمات جوجل هدية).',
    'طلب باقة النمو لولاء المطاعم'
  );

  const steps = [
    {
      num: '01',
      title: 'لمسة على كارت الطاولة أو الكاشير (بدون تطبيق)',
      desc: 'العميل يقرّب موبايله من كارت KUWI المبرمج على الطاولة أو يمسح الـ QR، يسجل اسمه ورقمه في 5 ثواني مرة واحدة بس.',
    },
    {
      num: '02',
      title: 'ختم بكود الكاشير اليومي + بلالين واحتفال',
      desc: 'الكاشير يملّيه الكود اليومي المكون من 4 أرقام (اللي بيتغير بضغطة زر عشان محدش يختم من وراك)، فالعميل يشوف باقيله كام زيارة على الوجبة المجانية.',
    },
    {
      num: '03',
      title: 'تحويل أوتوماتيك للمنيو الرقمي + حفظ رقمه للـ Retention 🍽️',
      desc: 'بعد ما يسجل زيارته يتحول تلقائي للمنيو الرقمي بتاع مطعمك يطلب زيادة، ورقمه بيتحفظ في لوحتك تتواصل معاه واتساب وتليفون بعروض البوكسات.',
    },
  ];

  const features = [
    'قاعدة أرقام زباينك ملكك 100% — تكلمهم في أي وقت على الواتساب أو التليفون بعروض الغدا والبوكسات وترجّعهم المحل',
    'أمان كامل ضد الغش: كود كاشير يومي متغير + فترة تهدئة تمنع أي حد يختم لنفسه أكتر من مرة في اليوم',
    'كروت الطاولات والكاشير بتوصلك مبرمجة ومؤمّنة بالكامل من فريق KUWI — ما بتشيلش هم أي إعدادات تقنية',
    'تحويل تلقائي لصفحة المنيو الرقمي بعد تسجيل الزيارة + استرجاع كارت العميل برقم موبايله لو مسح الكوكيز',
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans antialiased" dir="rtl">
      <header className="sticky top-3 z-40 px-4">
        <nav className="max-w-5xl mx-auto bg-[#14141B]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#C8FF2E] text-[#0B0B0F] font-bold text-sm flex items-center justify-center">
              K
            </span>
            <span className="text-sm font-semibold text-white">KUWI</span>
          </Link>
          <div className="hidden md:flex items-center gap-5 text-xs font-medium text-neutral-300">
            <Link href="/google-reviews" className="hover:text-white transition">كارت تقييمات جوجل</Link>
            <Link href="/individuals" className="hover:text-white transition">كروت الأفراد</Link>
            <Link href="/business" className="hover:text-white transition">حلول الشركات</Link>
            <Link href="/restaurants" className="text-[#C8FF2E] font-semibold">ولاء المطاعم</Link>
          </div>
          <a
            href="#packages"
            className="min-h-[40px] px-4 py-2 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
          >
            <span>فعّل النظام لمطعمك</span>
            <ArrowUpLeftIcon size={14} />
          </a>
        </nav>
      </header>

      <main>
        <section className="pt-12 pb-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-5">
            <span className="px-3.5 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C8FF2E] text-xs font-semibold inline-flex items-center gap-1.5">
              <SparklesIcon size={14} />
              <span>بدون تطبيقات • أرقام عملاء حقيقية • تحويل تلقائي للمنيو</span>
            </span>

            <h1 className="max-w-3xl text-3xl sm:text-5xl font-bold leading-tight text-white" style={{ textWrap: 'balance' }}>
              بتدفع 25% عمولة لتطبيقات التوصيل… وبتصرف إعلانات على زبون{' '}
              <span className="text-[#C8FF2E]">بيجيلك مرة وما بيرجعش؟</span>
            </h1>

            <p className="max-w-2xl text-base text-neutral-300 leading-relaxed">
              تكلفة إنك تجيب زبون جديد أغلى 5 مرات من إنك ترجّع زبون أكل عندك وانبسط! مع نظام <strong className="text-white">KUWI Loyalty + المنيو الذكي</strong>، كل طاولة بتاخد رقم الزبون بموافقته، تحمّسه يكمّل 6 زيارات على وجبة هدية بكود الكاشير اليومي، وتحوّله فوراً لمنيو مطعمك.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="#packages"
                className="min-h-[54px] px-8 py-4 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
              >
                <span>شوف باقات المطاعم والهدايا</span>
                <ArrowUpLeftIcon size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* 3-Step Diner Flow */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">رحلة الزبون جوه مطعمك في 3 خطوات</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {steps.map((s) => (
                <div key={s.num} className="bg-[#181824] border border-white/10 rounded-3xl p-6">
                  <div className="text-2xl font-bold font-mono text-[#C8FF2E] mb-2">{s.num}</div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f} className="p-4 rounded-2xl bg-[#181824] border border-white/10 flex items-start gap-2.5 text-xs sm:text-sm text-neutral-200">
                  <CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Restaurant Value Stack Packages (Zero Stands, Zero Discounts) */}
        <section id="packages" className="py-20 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#14141D] border border-white/10 rounded-3xl p-7 flex flex-col justify-between gap-6">
              <div>
                <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-[#7C3AED]/20 text-[#C8FF2E] mb-4">
                  بداية سريعة للكافيهات والمطاعم
                </span>
                <h3 className="text-xl font-bold text-white mb-2">باقة الفرع الواحد</h3>
                <p className="text-xs text-neutral-400 mb-5">كل ما تحتاجه لتشغيل نظام الولاء والمنيو خلال 24 ساعة</p>
                <ul className="space-y-3 text-xs sm:text-sm text-neutral-200">
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>5 كروت KUWI الذكية (NFC + QR) للطاولات والكاشير مبرمجة ومؤمّنة</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>لوحة التاجر والكاشير بالكود اليومي + قاعدة أرقام عملاء Retention</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>هدية الربط الذكي: تحويل أوتوماتيك للمنيو الرقمي بعد تسجيل الزيارة</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>ضمان استبدال واسترداد 365 يوم</span></li>
                </ul>
              </div>
              <a
                href={orderBranch}
                className="w-full min-h-[50px] py-3.5 px-5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                <span>اطلب باقة الفرع الواحد</span>
                <ArrowUpLeftIcon size={16} />
              </a>
            </div>

            <div className="bg-[#181628] border border-[#C8FF2E] rounded-3xl p-7 flex flex-col justify-between gap-6">
              <div>
                <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-[#C8FF2E] text-[#0B0B0F] mb-4">
                  الأكثر اختياراً • أعلى قيمة لمطعمك
                </span>
                <h3 className="text-xl font-bold text-white mb-2">باقة النمو والـ Retention</h3>
                <p className="text-xs text-neutral-300 mb-5">تغطية كاملة للطاولات + تقييمات جوجل مجاناً</p>
                <ul className="space-y-3 text-xs sm:text-sm text-neutral-200">
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>20 كارت KUWI الذكي (NFC + QR) للطاولات والكاشير مطبوعين بشعار مطعمك</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>هدية 3 كروت تقييمات جوجل الذكية للكاشير مجاناً</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>هدية سكريبت الـ Retention: رسائل واتساب جاهزة ترجّع العميل اللي غاب</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>تدريب كامل للكاشير + تحويل أوتوماتيك للمنيو + ضمان 365 يوم</span></li>
                </ul>
              </div>
              <a
                href={orderGrowth}
                className="w-full min-h-[50px] py-3.5 px-5 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                <span>اطلب باقة النمو الآن</span>
                <ArrowUpLeftIcon size={16} />
              </a>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-8 p-5 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-neutral-200 text-center">
            <ShieldIcon size={18} className="text-[#C8FF2E] shrink-0" />
            <span>تشغيل كامل خلال 24 ساعة مع تدريب الكاشير وضمان استرداد 365 يوم</span>
          </div>
        </section>
      </main>
    </div>
  );
}
