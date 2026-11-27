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
  title: 'نظام ولاء المطاعم والكافيهات + المنيو الذكي من KUWI — ضاعف تكرار زيارات عملائك',
  description:
    'نظام أختام ولاء رقمي بدون تطبيقات: كود كاشير يومي مضاد للتلاعب، تحويل تلقائي لصفحة المنيو بعد تسجيل الزيارة، وقاعدة أرقام عملاء جاهزة للواتساب وإعادة الاستهداف.',
};

export default function RestaurantsLandingPage() {
  const orderCafe = getKuwiOrderHref(
    'أهلاً فريق KUWI، أريد تفعيل نظام ولاء المطاعم + المنيو الذكي لفرع واحد.',
    'طلب نظام ولاء المطاعم — فرع واحد'
  );
  const orderGrowth = getKuwiOrderHref(
    'أهلاً فريق KUWI، أريد باقة النمو للمطاعم (حتى 20 ستاند طاولة مبرمج + نظام الولاء والمنيو + 3 كروت تقييمات جوجل).',
    'طلب نظام ولاء المطاعم — باقة النمو'
  );

  const steps = [
    {
      num: '01',
      title: 'لمسة على ستاند الطاولة (بدون تطبيق)',
      desc: 'يقرب العميل موبايله من ستاند KUWI المبرمج على الطاولة أو يمسح QR، فيسجل اسمه ورقمه خلال 5 ثوانٍ.',
    },
    {
      num: '02',
      title: 'ختم بكود الكاشير اليومي + احتفالية فورية',
      desc: 'يُدخل كود الكاشير اليومي (المتغير بضغطة زر لمنع أي تلاعب) فيرى أختامه المتبقية على وجبته المجانية مع بلالين تفاعلية.',
    },
    {
      num: '03',
      title: 'تحويل تلقائي لصفحة المنيو الرقمي 🍽️',
      desc: 'فور تسجيل الزيارة، يتحول العميل تلقائياً إلى المنيو الرقمي الخاص بمطعمك ليتصفح الأصناف ويزيد متوسط فاتورته، بينما يُحفظ رقمه في لوحتك لإعادة الاستهداف.',
    },
  ];

  const features = [
    'قاعدة أرقام عملائك ملكك 100% — تواصل معهم مباشرة بضغطة واتساب أو مكالمة Retention لعروض البوكسات والوجبات',
    'كود كاشير يومي مشفر + فترة تهدئة (Cooldown) تمنع أي تلاعب أو ختم مكرر في نفس اليوم',
    'ستاندات الطاولات تصلك مبرمجة ومؤمّنة بالكامل من KUWI بدون أي تعقيد تقني على الكاشير',
    'تحويل تلقائي لصفحة المنيو الرقمي بعد تسجيل الزيارة + استرجاع فوري للبطاقة برقم الموبايل حتى لو حذف العميل الكوكيز',
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
              <span>امتلك عملاءك • ضاعف تكرار الزيارات • حوّلهم لمنيوك تلقائياً</span>
            </span>

            <h1 className="max-w-3xl text-3xl sm:text-5xl font-bold leading-tight text-white" style={{ textWrap: 'balance' }}>
              أوقف دفع 25% عمولة لتطبيقات التوصيل — حوّل زبون المرة الواحدة إلى{' '}
              <span className="text-[#C8FF2E]">عميل يعود لك 6 مرات</span>
            </h1>

            <p className="max-w-2xl text-base text-neutral-300 leading-relaxed">
              تكلفة كسب عميل جديد تزيد 5 أضعاف عن عودة عميل زارك بالفعل. مع <strong className="text-white">KUWI Loyalty + Digital Menu</strong>، كل طاولة تجمع أرقام عملائك، تمنحهم أختام الولاء بكود الكاشير اليومي، وتحولهم فوراً لصفحة المنيو الرقمي.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="#packages"
                className="min-h-[54px] px-8 py-4 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
              >
                <span>شاهد باقات المطاعم واحجز التشغيل</span>
                <ArrowUpLeftIcon size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* 3-Step Diner Flow */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">كيف يعمل النظام داخل مطعمك في 3 خطوات؟</h2>
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

        {/* Restaurant Packages */}
        <section id="packages" className="py-20 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#14141D] border border-white/10 rounded-3xl p-7 flex flex-col justify-between gap-6">
              <div>
                <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-[#7C3AED]/20 text-[#C8FF2E] mb-4">
                  بداية سريعة للكافيهات
                </span>
                <h3 className="text-xl font-bold text-white mb-2">باقة الفرع الواحد</h3>
                <p className="text-xs text-neutral-400 mb-5">كل ما تحتاجه لتشغيل نظام الولاء والمنيو خلال 24 ساعة</p>
                <ul className="space-y-3 text-xs sm:text-sm text-neutral-200">
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>نظام ولاء كامل + لوحة كاشير وكود يومي</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>ربط وتحويل تلقائي للمنيو الرقمي بعد الختم</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>5 ستاندات طاولات NFC + QR مبرمجة ومؤمّنة</span></li>
                </ul>
              </div>
              <a
                href={orderCafe}
                className="w-full min-h-[50px] py-3.5 px-5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                <span>احجز باقة الفرع الواحد</span>
                <ArrowUpLeftIcon size={16} />
              </a>
            </div>

            <div className="bg-[#181628] border border-[#C8FF2E] rounded-3xl p-7 flex flex-col justify-between gap-6">
              <div>
                <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-[#C8FF2E] text-[#0B0B0F] mb-4">
                  الأكثر طلباً للمطاعم المزدحمة
                </span>
                <h3 className="text-xl font-bold text-white mb-2">باقة النمو والـ Retention</h3>
                <p className="text-xs text-neutral-300 mb-5">تجهيز شامل للطاولات + تقييمات جوجل مجاناً</p>
                <ul className="space-y-3 text-xs sm:text-sm text-neutral-200">
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>حتى 20 ستاند طاولة NFC + QR مبرمجة بشعار مطعمك</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>لوحة أرقام عملاء Retention بضغطة واتساب ومكالمة</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>هدية: 3 كروت تقييمات جوجل الذكية للكاشير</span></li>
                  <li className="flex items-start gap-2"><CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" /><span>تدريب الكاشير + ضمان استرجاع 365 يوماً</span></li>
                </ul>
              </div>
              <a
                href={orderGrowth}
                className="w-full min-h-[50px] py-3.5 px-5 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                <span>احجز باقة النمو الآن</span>
                <ArrowUpLeftIcon size={16} />
              </a>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-8 p-5 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-neutral-200 text-center">
            <ShieldIcon size={18} className="text-[#C8FF2E] shrink-0" />
            <span>تشغيل كامل خلال 24 ساعة مع تدريب الكاشير وضمان استرجاع 365 يوماً</span>
          </div>
        </section>
      </main>
    </div>
  );
}
