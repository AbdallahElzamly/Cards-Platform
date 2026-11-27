import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpLeftIcon,
  CheckIcon,
  ShieldIcon,
  SparklesIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'نظام ولاء المطاعم والكافيهات + المنيو الذكي من KUWI — ضاعف تكرار زيارات عملائك',
  description:
    'نظام أختام ولاء رقمي بدون تطبيقات: كود كاشير يومي مضاد للتلاعب، تحويل تلقائي لصفحة المنيو بعد تسجيل الزيارة، وقاعدة أرقام عملاء جاهزة للواتساب وإعادة الاستهداف.',
};

const WHATSAPP_RESTAURANT =
  'https://wa.me/201112708046?text=' +
  encodeURIComponent(
    'أهلاً فريق KUWI، أريد حجز عرض تجريبي وتفعيل نظام ولاء المطاعم والكافيهات + المنيو الذكي لمطعمي.'
  );

export default function RestaurantsLandingPage() {
  const features = [
    {
      title: 'بدون تحميل تطبيق — يعمل من ستاند الطاولة في 5 ثوانٍ',
      desc: 'يقرب العميل موبايله من ستاند KUWI على الطاولة، يسجل اسمه ورقمه، ويختم زيارته بكود الكاشير اليومي فوراً مع احتفالية بصرية تحفزه على العودة.',
    },
    {
      title: 'تحويل تلقائي لصفحة المنيو الرقمي بعد تسجيل الزيارة 🍽️',
      desc: 'بمجرد أن يرى العميل عدد الزيارات المتبقية على وجبته المجانية، يُحوّل تلقائياً إلى المنيو الرقمي الخاص بمطعمك ليتصفح الأصناف ويزيد قيمة طلبه.',
    },
    {
      title: 'قاعدة أرقام عملائك ملكك 100% لإعادة الاستهداف',
      desc: 'احتفظ بأرقام عملائك داخل لوحة تحكم المطعم وتواصل معهم مباشرة عبر واتساب أو مكالمات الـ Retention بعروض البوكسات والوجبات الجديدة.',
    },
    {
      title: 'ستاندات مبرمجة ومؤمّنة بالكامل من KUWI',
      desc: 'لا تشغل بالك بأي برمجة تقنية — نستلم بيانات مطعمك، نبرمج ستاندات الطاولات، ونسلمك لوحة كاشير جاهزة للعمل من أول يوم.',
    },
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
            href={WHATSAPP_RESTAURANT}
            target="_blank"
            rel="noopener noreferrer"
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
              <span>نظام ولاء المطاعم والكافيهات + المنيو الذكي</span>
            </span>

            <h1 className="max-w-3xl text-3xl sm:text-5xl font-bold leading-tight text-white" style={{ textWrap: 'balance' }}>
              حوّل زبون المرة الواحدة إلى{' '}
              <span className="text-[#C8FF2E]">عميل دائم يعود لك 6 مرات</span> بدون عمولات تطبيقات التوصيل
            </h1>

            <p className="max-w-2xl text-base text-neutral-300 leading-relaxed">
              توقف عن دفع 25% عمولة لتطبيقات التوصيل على عملائك أنفسهم! مع <strong className="text-white">KUWI Loyalty</strong>، كل طاولة تجمع لك أرقام عملائك، تمنحهم أختام الولاء بكود الكاشير اليومي، وتحولهم تلقائياً لمنيو مطعمك.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={WHATSAPP_RESTAURANT}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[54px] px-8 py-4 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
              >
                <WhatsAppIcon size={20} />
                <span>احجز تفعيل النظام وستاندات الطاولات الآن</span>
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {features.map((f) => (
              <div key={f.title} className="bg-[#181824] border border-white/10 rounded-3xl p-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#C8FF2E] font-bold text-base">
                  <CheckIcon size={16} className="shrink-0" />
                  <h2>{f.title}</h2>
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm text-white">
              <ShieldIcon size={20} className="text-[#C8FF2E] shrink-0" />
              <span>تشغيل كامل خلال 24 ساعة مع تدريب الكاشير وضمان استرجاع 365 يوماً</span>
            </div>
            <a
              href={WHATSAPP_RESTAURANT}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[48px] px-6 py-3 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-sm rounded-xl inline-flex items-center gap-2 shrink-0"
            >
              <WhatsAppIcon size={17} />
              <span>تواصل معنا عبر واتساب</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
