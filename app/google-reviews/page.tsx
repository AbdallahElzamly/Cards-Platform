import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpLeftIcon,
  CheckIcon,
  QrCodeIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'كارت تقييمات جوجل الذكي من KUWI — ضاعف تقييماتك 5 نجوم في 3 ثوانٍ',
  description:
    'كارت وستاند تقييمات خرائط جوجل بتقنية NFC و QR من KUWI. حوّل كل عميل راضٍ إلى تقييم 5 نجوم حقيقي بدون تطبيقات وبضمان استرجاع 365 يوماً.',
};

const WHATSAPP_ORDER =
  'https://wa.me/201112708046?text=' +
  encodeURIComponent(
    'أهلاً فريق KUWI، أريد طلب باقة كروت تقييمات جوجل الذكية (Google Reviews NFC) لمشروعي.'
  );

export default function GoogleReviewsLandingPage() {
  const valueStack = [
    { item: 'كارت / ستاند KUWI NFC + QR مقاوم للماء والخدش ومبرمج مسبقاً باسم نشاطك', value: '450 ج.م' },
    { item: 'برمجة وتوجيه مباشر لصفحة تقييم خرائط جوجل (يفتح نافذة الـ 5 نجوم فوراً)', value: '250 ج.م' },
    { item: 'ربط ديناميكي مرن (تعديل رابط فرعك في أي وقت بدون إعادة طباعة الكارت)', value: '300 ج.م' },
    { item: 'دليل تدريب الكاشير وموظفي الاستقبال لرفع نسبة التقييمات 4 أضعاف', value: '200 ج.م' },
    { item: 'ضمان استبدال واسترجاع كامل للمبلغ لمدة 365 يوماً بدون أسئلة', value: 'مضمون 100%' },
  ];

  const faqs = [
    {
      q: 'هل العميل يحتاج تحميل تطبيق عشان يقيّم؟',
      a: 'لا نهائياً. مجرد ما يقرب موبايله (iPhone أو Android) من الكارت أو يمسح الـ QR تفتح نافذة التقييم على خرائط جوجل فوراً في أقل من 3 ثوانٍ.',
    },
    {
      q: 'هل الكارت يشتغل مع المطاعم والعيادات والمحلات؟',
      a: 'نعم، مثالي للمطاعم، الكافيهات، العيادات، صالونات التجميل، مراكز الصيانة، والشركات التي تعتمد على ظهورها في أعلى نتائج Google Maps.',
    },
    {
      q: 'هل أحتاج أبرمج الكارت بنفسي؟',
      a: 'أبداً. فريق KUWI يطبع ويبرمج الكارت على رابط تقييمات نشاطك قبل الشحن — تستلمه وتضعه على الكاشير ويبدأ في جمع التقييمات في نفس الدقيقة.',
    },
    {
      q: 'ماذا لو لم تزد تقييمات نشاطي؟',
      a: 'معك ضمان KUWI الذهبي لمدة 365 يوماً كاملة — إذا لم تلاحظ فرقاً حقيقياً في عدد تقييماتك على جوجل، تسترد أموالك بالكامل.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans antialiased" dir="rtl">
      {/* Compact Brand Header */}
      <header className="sticky top-3 z-40 px-4">
        <nav className="max-w-5xl mx-auto bg-[#14141B]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#C8FF2E] text-[#0B0B0F] font-bold text-sm flex items-center justify-center">
              K
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">KUWI</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 text-xs font-medium text-neutral-300">
            <Link href="/google-reviews" className="text-[#C8FF2E] font-semibold">
              كارت تقييمات جوجل
            </Link>
            <Link href="/individuals" className="hover:text-white transition">
              كروت الأفراد
            </Link>
            <Link href="/business" className="hover:text-white transition">
              حلول الشركات
            </Link>
            <Link href="/restaurants" className="hover:text-white transition">
              ولاء المطاعم
            </Link>
          </div>

          <a
            href={WHATSAPP_ORDER}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] px-4 py-2 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition"
          >
            <span>اطلب كارتك الآن</span>
            <ArrowUpLeftIcon size={14} />
          </a>
        </nav>
      </header>

      <main>
        {/* Above-the-Fold Hero: Direct-Response Copy + Designer Mockup */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 flex flex-col gap-5 text-right">
              <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C8FF2E] text-xs font-semibold">
                <StarIcon size={14} />
                <span>تصدّر نتائج خرائط جوجل بدون إعلانات شهرية</span>
              </div>

              <h1
                className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                حوّل كل عميل راضٍ في محلك إلى{' '}
                <span className="text-[#C8FF2E]">تقييم 5 نجوم على جوجل</span> في 3 ثوانٍ بلمسة واحدة
              </h1>

              <p className="text-base text-neutral-300 leading-relaxed">
                90% من عملائك السعداء ينسون كتابة تقييم بمجرد خروجهم من الباب، بينما العميل الغاضب يكتب فوراً! كارت{' '}
                <strong className="text-white">KUWI الذكي</strong> يزيل كل العوائق: لمسة واحدة بالموبايل أو مسحة QR تفتح نافذة التقييم مباشرة أمام عميلك وهو ما زال مبتسماً على الكاشير.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={WHATSAPP_ORDER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[52px] px-7 py-3.5 bg-[#C8FF2E] hover:brightness-95 active:scale-[0.98] text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <WhatsAppIcon size={19} />
                  <span>اطلب كارت تقييمات جوجل الآن</span>
                </a>
                <a
                  href="#offer"
                  className="min-h-[52px] px-6 py-3.5 bg-[#181822] hover:bg-[#222230] border border-white/10 text-white font-semibold text-sm rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>شاهد العرض والضمان</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  يعمل على جميع هواتف iPhone و Android
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  بدون اشتراك شهري
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  ضمان استرجاع 365 يوماً
                </span>
              </div>
            </div>

            {/* Graphic Designer Real Card Visual */}
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
                    <div className="text-xs font-bold text-[#C8FF2E]">تصميم KUWI الأصلي عالي التباين</div>
                    <div className="text-[11px] text-neutral-300">
                      شريحة NFC أصلية + رمز QR احتياطي • مبرمج وجاهز للتشغيل فوراً
                    </div>
                  </div>
                  <QrCodeIcon size={20} className="text-[#C8FF2E] shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain -> Agitation -> Solution Strip (Copyhackers PAS Framework) */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#181824] border border-white/10 rounded-3xl p-6">
              <div className="text-xs font-bold text-rose-400 mb-2">المشكلة المكلفة</div>
              <h2 className="text-lg font-bold text-white mb-2">العميل يبحث على جوجل قبل أن يزورك</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                عندما يبحث عميل جديد عن أفضل مطعم أو عيادة أو محل بجواره، يختار أول 3 نتائج بأعلى تقييمات — وكل يوم بدون تقييمات جديدة يعني عملاء يذهبون لمنافسك مجاناً.
              </p>
            </div>
            <div className="bg-[#181824] border border-white/10 rounded-3xl p-6">
              <div className="text-xs font-bold text-[#C8FF2E] mb-2">الحل في 3 ثوانٍ</div>
              <h2 className="text-lg font-bold text-white mb-2">قرّب الموبايل ← اختر 5 نجوم ← تم</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                لا بحث بالاسم، لا كتابة رابط طويل، ولا إحراج للكاشير. لمسة واحدة تفتح صفحة تقييم مشروعك مباشرة ليترك العميل رأيه الإيجابي فوراً.
              </p>
            </div>
            <div className="bg-[#181824] border border-white/10 rounded-3xl p-6">
              <div className="text-xs font-bold text-[#A78BFA] mb-2">النتيجة التراكمية</div>
              <h2 className="text-lg font-bold text-white mb-2">زيارات مجانية متزايدة كل شهر</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                كل تقييم جديد يرفع ترتيبك في خرائط جوجل للأبد، ويخفض تكلفة إعلاناتك المدفوعة لأن العميل يثق في نشاطك قبل أن يراسلك.
              </p>
            </div>
          </div>
        </section>

        {/* Alex Hormozi Grand Slam Value Stack Offer */}
        <section id="offer" className="py-20 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto bg-[#15151F] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-10">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7C3AED]/25 text-[#C8FF2E] text-xs font-bold mb-3">
                <SparklesIcon size={14} />
                <span>عرض الإطلاق بدون اشتراك شهري</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                كل ما تحتاجه لمضاعفة تقييماتك على خرائط جوجل
              </h2>
              <p className="text-sm text-neutral-400">
                استثمار لمرة واحدة يخدم نشاطك لسنوات — مبرمج بالكامل من فريق KUWI
              </p>
            </div>

            <div className="divide-y divide-white/10 border border-white/10 rounded-2xl bg-[#0F0F17] mb-8">
              {valueStack.map((row) => (
                <div key={row.item} className="p-4 flex items-center justify-between gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 text-neutral-200">
                    <CheckIcon size={16} className="text-[#C8FF2E] shrink-0" />
                    <span>{row.item}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-400 shrink-0">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center bg-[#7C3AED]/15 border border-[#7C3AED]/40 rounded-2xl p-6">
              <div>
                <div className="text-xs text-neutral-300 line-through mb-1">القيمة الإجمالية: 1,200 ج.م</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono text-[#C8FF2E]">350</span>
                  <span className="text-sm font-semibold text-white">ج.م فقط للكارت (خصم خاص للكميات)</span>
                </div>
                <p className="text-xs text-neutral-300 mt-2 flex items-center gap-1.5">
                  <ShieldIcon size={15} className="text-[#C8FF2E]" />
                  <span>ضمان استرجاع 365 يوماً • شحن سريع لجميع المحافظات</span>
                </p>
              </div>
              <a
                href={WHATSAPP_ORDER}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[54px] px-6 py-4 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition"
              >
                <WhatsAppIcon size={20} />
                <span>احجز كارت تقييمات جوجل عبر واتساب</span>
              </a>
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
