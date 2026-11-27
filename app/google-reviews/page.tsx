import type { Metadata } from 'next';
import Link from 'next/link';
import { getKuwiOrderHref } from '@/lib/brand-config';
import {
  ArrowUpLeftIcon,
  CheckIcon,
  QrCodeIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'كارت تقييمات جوجل الذكي من KUWI — لا تحويلة، لا بحث، 5 نجوم في 3 ثوانٍ',
  description:
    'كارت وستاند تقييمات خرائط جوجل بتقنية NFC و QR من KUWI. مسار مباشر من تجربة ممتازة إلى تقييم 5 نجوم على Google Maps بدون تطبيقات وبضمان 365 يوماً.',
};

export default function GoogleReviewsLandingPage() {
  const orderStarter = getKuwiOrderHref(
    'أهلاً فريق KUWI، أريد طلب باقة كارت تقييمات جوجل الذكي (كارت الكاشير — 350 ج.م).',
    'طلب كارت تقييمات جوجل — كارت الكاشير'
  );
  const orderGrowth = getKuwiOrderHref(
    'أهلاً فريق KUWI، أريد طلب باقة النمو لتقييمات جوجل (3 كروت + ستاند كاونتر — 890 ج.م).',
    'طلب كارت تقييمات جوجل — باقة النمو'
  );
  const orderBranches = getKuwiOrderHref(
    'أهلاً فريق KUWI، أريد طلب باقة الفروع لتقييمات جوجل (10 كروت + 3 ستاندات — 2,400 ج.م).',
    'طلب كارت تقييمات جوجل — باقة الفروع'
  );

  const slabs = [
    {
      name: 'كارت الكاشير',
      badge: 'بداية سريعة',
      price: '350',
      unit: 'ج.م لمرة واحدة',
      featured: false,
      href: orderStarter,
      items: [
        '1 كارت KUWI NFC + QR مقاوم للماء والخدش',
        'برمجة مسبقة على رابط تقييم خرائط جوجل لنشاطك',
        'تعديل الرابط مستقبلاً بدون إعادة طباعة الكارت',
        'ضمان استرجاع كامل لمدة 365 يوماً',
      ],
    },
    {
      name: 'باقة النمو (الأكثر مبيعاً)',
      badge: 'أعلى عائد ROI • وفر 25%',
      price: '890',
      unit: 'ج.م بدلاً من 1,200 ج.م',
      featured: true,
      href: orderGrowth,
      items: [
        '3 كروت NFC للكاشير والويتر + 1 ستاند كاونتر فاخر',
        'كارت في اليد + ستاند على الكاشير لمضاعفة التقييمات 4×',
        'برمجة كاملة باسم فرعك + دليل سكريبت الكاشير (هدية)',
        'تغيير رابط الفرع مجاناً في أي وقت بدون إعادة طباعة',
        'ضمان استرجاع 365 يوماً بدون أسئلة',
      ],
    },
    {
      name: 'باقة الفروع والسلاسل',
      badge: 'للمطاعم والعيادات متعددة الفروع',
      price: '2,400',
      unit: 'ج.م بدلاً من 3,500 ج.م',
      featured: false,
      href: orderBranches,
      items: [
        '10 كروت NFC مخصصة + 3 ستاندات كاونتر بشعارك',
        'ربط منفصل لكل فرع مع تتبع عدد المسحات الفعلي',
        'تجهيز وبرمجة كاملة قبل الشحن خلال 48 ساعة',
        'أولوية دعم فني واستبدال فوري لمدة سنة كاملة',
      ],
    },
  ];

  const faqs = [
    {
      q: 'هل العميل يحتاج يحمّل تطبيق أو يبحث عن اسم المحل؟',
      a: 'لا نهائياً. لا بحث بالاسم، لا خطوات معقدة، ولا تطبيقات. لمسة واحدة بالموبايل (iPhone أو Android) أو مسحة للـ QR تفتح نافذة الـ 5 نجوم على خرائط جوجل في 3 ثوانٍ.',
    },
    {
      q: 'هل أحتاج أبرمج الكارت بنفسي بعد الاستلام؟',
      a: 'أبداً (Done-For-You 100%). ترسل لنا رابط نشاطك على خرائط جوجل، وفريق KUWI يطبع ويبرمج الكارت ويختبره قبل الشحن ليشتغل في نفس اللحظة التي تستلمه فيها.',
    },
    {
      q: 'ليه التقييمات على جوجل بتجيب مبيعات أكتر من الإعلانات؟',
      a: 'لأن العميل الذي يبحث على Google Maps جاهز للشراء الآن! أول 3 نتائج بأعلى تقييم تحصل على أكثر من 70% من المكالمات والزيارات مجاناً كل شهر بدون دفع جنيه واحد لإعلانات ممولة.',
    },
    {
      q: 'إيه ضمان الـ 365 يوم بالظبط؟',
      a: 'جرّب الكارت على الكاشير سنة كاملة؛ لو لم تلاحظ زيادة حقيقية في تقييمات عملائك على خرائط جوجل، استرد كامل المبلغ بدون أي تعقيد.',
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
            <span className="text-sm font-semibold tracking-tight text-white">KUWI</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 text-xs font-medium text-neutral-300">
            <Link href="/google-reviews" className="text-[#C8FF2E] font-semibold">كارت تقييمات جوجل</Link>
            <Link href="/individuals" className="hover:text-white transition">كروت الأفراد</Link>
            <Link href="/business" className="hover:text-white transition">حلول الشركات</Link>
            <Link href="/restaurants" className="hover:text-white transition">ولاء المطاعم</Link>
          </div>

          <a
            href="#pricing"
            className="min-h-[40px] px-4 py-2 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition"
          >
            <span>اختر باقتك الآن</span>
            <ArrowUpLeftIcon size={14} />
          </a>
        </nav>
      </header>

      <main>
        {/* Hero: Hormozi Hook + Copyhackers Direct-Response + Designer Mockup */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 flex flex-col gap-5 text-right">
              <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C8FF2E] text-xs font-semibold">
                <StarIcon size={14} />
                <span>بدون بحث • بدون روابط طويلة • بدون اشتراك شهري</span>
              </div>

              <h1
                className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                لا تترك عميلك الراضي يغادر بصمت — حوّله إلى{' '}
                <span className="text-[#C8FF2E]">تقييم 5 نجوم على جوجل</span> في 3 ثوانٍ
              </h1>

              <p className="text-base text-neutral-300 leading-relaxed">
                كارت في يد الكاشير + ستاند على الكاونتر. مسار مباشر بدون أي تعقيد: قرّب الموبايل ← تفتح نافذة تقييم نشاطك على Google Maps فوراً ← يضغط العميل 5 نجوم وهو ما زال مبتسماً أمامك.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="#pricing"
                  className="min-h-[52px] px-7 py-3.5 bg-[#C8FF2E] hover:brightness-95 active:scale-[0.98] text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>شاهد الباقات واطلب الآن</span>
                  <ArrowUpLeftIcon size={18} />
                </a>
                <a
                  href={orderGrowth}
                  className="min-h-[52px] px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>احجز باقة النمو مباشرة</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  iPhone و Android فوراً
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  مبرمج وجاهز من KUWI
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  ضمان استرجاع 365 يوماً
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden border border-[#7C3AED]/40 bg-[#7C3AED] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/kuwi-google-review-card.jpg"
                  alt="كارت تقييمات جوجل الذكي من KUWI — قرب تليفونك أو امسح الكود وقيّمنا"
                  className="w-full h-auto rounded-2xl object-cover"
                />
                <div className="absolute bottom-5 right-5 left-5 bg-[#0B0B0F]/85 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#C8FF2E]">كارت في اليد + ستاند على الكاونتر</div>
                    <div className="text-[11px] text-neutral-300">
                      شريحة NFC أصلية + رمز QR احتياطي • يفتح صفحة التقييم مباشرة في 3 ثوانٍ
                    </div>
                  </div>
                  <QrCodeIcon size={20} className="text-[#C8FF2E] shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hormozi ROI Math & Proof Strip */}
        <section className="py-12 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#181824] border border-white/10 rounded-3xl p-6">
              <div className="text-2xl font-bold font-mono text-[#C8FF2E] mb-1">3 ثوانٍ فقط</div>
              <h2 className="text-base font-bold text-white mb-1.5">إزالة 100% من العوائق</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                العميل لا يكتب اسم محلك ولا يفتح تطبيقاً. لمسة واحدة = تقييم مكتمل قبل أن يغادر الكاشير.
              </p>
            </div>
            <div className="bg-[#181824] border border-white/10 rounded-3xl p-6">
              <div className="text-2xl font-bold font-mono text-[#C8FF2E] mb-1">عميلان فقط</div>
              <h2 className="text-base font-bold text-white mb-1.5">يغطيان ثمن الكارت للأبد</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                لو تقييماتك الجديدة على Google Maps جلبت لك عميلين فقط هذا الشهر، تكون قد استرددت استثمارك أضعافاً مضاعفة بدون أي اشتراك شهري.
              </p>
            </div>
            <div className="bg-[#181824] border border-white/10 rounded-3xl p-6">
              <div className="text-2xl font-bold font-mono text-[#A78BFA] mb-1">0% مخاطرة</div>
              <h2 className="text-base font-bold text-white mb-1.5">ضمان KUWI لمدة 365 يوماً</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                نحن واثقون من النتيجة لدرجة أننا نتحمل المخاطرة بالكامل لمدة سنة — إن لم تزد تقييماتك، تسترد أموالك كاملة.
              </p>
            </div>
          </div>
        </section>

        {/* Hormozi Money Models: 3 Pricing Slabs */}
        <section id="pricing" className="py-20 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7C3AED]/25 text-[#C8FF2E] text-xs font-bold mb-3">
                <SparklesIcon size={14} />
                <span>باقات استثمار لمرة واحدة — بدون اشتراك شهري</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                اختر الباقة المناسبة لحجم نشاطك
              </h2>
              <p className="text-sm text-neutral-400">
                جميع الباقات تصل إليك مبرمجة وجاهزة للتشغيل الفوري مع ضمان 365 يوماً
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {slabs.map((slab) => (
                <div
                  key={slab.name}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-6 border ${
                    slab.featured
                      ? 'bg-[#181628] border-[#C8FF2E] ring-1 ring-[#C8FF2E]/40'
                      : 'bg-[#14141D] border-white/10'
                  }`}
                >
                  <div>
                    <span
                      className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-4 ${
                        slab.featured
                          ? 'bg-[#C8FF2E] text-[#0B0B0F]'
                          : 'bg-[#7C3AED]/20 text-[#C8FF2E]'
                      }`}
                    >
                      {slab.badge}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">{slab.name}</h3>
                    <div className="flex items-baseline gap-2 mb-5">
                      <span className="text-4xl font-bold font-mono text-[#C8FF2E]">{slab.price}</span>
                      <span className="text-xs text-neutral-300">{slab.unit}</span>
                    </div>

                    <ul className="space-y-3 text-xs sm:text-sm text-neutral-200">
                      {slab.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href={slab.href}
                    className={`w-full min-h-[50px] py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                      slab.featured
                        ? 'bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F]'
                        : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white'
                    }`}
                  >
                    <span>اطلب {slab.name} الآن</span>
                    <ArrowUpLeftIcon size={16} />
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-neutral-200 text-center">
              <ShieldIcon size={18} className="text-[#C8FF2E] shrink-0" />
              <span>ضمان KUWI الذهبي: 365 يوماً كاملة ضمان استرداد — شحن سريع لجميع المحافظات</span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">أسئلة شائعة قبل الطلب</h2>
            <div className="space-y-3">
              {faqs.map((item) => (
                <div key={item.q} className="bg-[#15151F] border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-[#C8FF2E] mb-1.5">{item.q}</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
