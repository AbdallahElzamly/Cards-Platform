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
  title: 'كارت تقييمات جوجل الذكي من KUWI — منافسك بياخد زباينك بسبب تقييماته؟',
  description:
    'كارت KUWI الذكي لتقييمات خرائط جوجل بتقنية NFC و QR على نفس الكارت. حوّل عميلك المبسوط لتقييم 5 نجوم حقيقي في 3 ثواني قبل ما يخرج من الباب، بدون اشتراك سنوي وبضمان 365 يوم.',
};

export default function GoogleReviewsLandingPage() {
  const orderCashier = getKuwiOrderHref(
    'أهلاً فريق KUWI، عايز أطلب باقة الكاشير لتقييمات جوجل (كارت KUWI الذكي + هدايا التأسيس والضمان — 300 ج.م).',
    'طلب باقة الكاشير — كارت تقييمات جوجل'
  );
  const orderTeam = getKuwiOrderHref(
    'أهلاً فريق KUWI، عايز أطلب باقة الفريق لتقييمات جوجل (3 كروت KUWI الذكية + فحص جوجل ماب وسكريبت الموظفين وقوالب الردود — 890 ج.م).',
    'طلب باقة الفريق — كروت تقييمات جوجل'
  );
  const orderBranches = getKuwiOrderHref(
    'أهلاً فريق KUWI، عايز أطلب باقة الفروع لتقييمات جوجل (10 كروت KUWI الذكية + كارت بيزنس هدية وتراكينج لكل فرع — 2,500 ج.م).',
    'طلب باقة الفروع — كروت تقييمات جوجل'
  );

  const marketPains = [
    {
      tag: 'مشكلة كل صاحب مكان',
      title: 'الزبون بيقرأ آخر تقييمات قبل ما يتحركلك',
      desc: 'العميل اللي بيدوّر على جوجل ماب ما بيبصّش على جودة شغلك في الحقيقة، بيبص على آخر 5 تقييمات اتكتبوا الشهر ده. لو منافسك عنده تقييمات أحدث منك، الزبون بيروحله هو تلقائي.',
    },
    {
      tag: 'آيفون • أندرويد • موبايلات قديمة',
      title: 'مفيش زبون هيقف يدوّر على اسمك أو يحمّل تطبيق',
      desc: 'كارت KUWI بيجمع تقنية NFC للآيفون والأندرويد مع رمز QR مطبوع على الضهر لأي موبايل قديم. لمسة واحدة عند الكاشير وبتفتح نافذة الـ 5 نجوم في 3 ثواني.',
    },
    {
      tag: 'بدون مخاطرة على صفحتك',
      title: 'أمان 100% ضد مخالفات سياسة جوجل',
      desc: 'لا فلترة مخالفة ولا حوافز تغلق حسابك على جوجل ماب. بتاخد تقييمات حقيقية من زباينك في المكان نفسه، ومعاها دليل المسموح والممنوع عشان تقييماتك ما تتمسحش أبداً.',
    },
  ];

  const planSteps = [
    {
      num: '01',
      title: 'تبعتلنا رابط مكانك على جوجل ماب',
      desc: 'فريق KUWI بيبرمج الكارت ويربطه مباشرة بصفحة التقييمات الخاصة بنشاطك قبل الشحن.',
    },
    {
      num: '02',
      title: 'تستلم كارتك جاهز خلال 48 ساعة',
      desc: 'كارت شيك وعالي التباين يوصلك لحد باب محلك أو مطعمك ومختبر وجاهز يشتغل في نفس الدقيقة.',
    },
    {
      num: '03',
      title: 'لمسة عند الكاشير ← تقييم في 3 ثواني',
      desc: 'العميل المبسوط بيقرّب موبايله وهو مبتسم، يضغط الـ 5 نجوم، واسمك يطلع أعلى في جوجل ماب يوم بعد يوم.',
    },
  ];

  const slabs = [
    {
      name: 'باقة الكاشير',
      badge: 'بداية سريعة للأفراد والمحلات',
      price: '300',
      unit: 'ج.م دفعة واحدة للأبد',
      featured: false,
      href: orderCashier,
      items: [
        '1 كارت KUWI الذكي (NFC + QR مطبوع على الضهر) مقاوم للماء والخدش',
        'هدية التأسيس: برمجة وربط الكارت بصفحتك على جوجل ماب قبل الشحن',
        'هدية الأمان: ورقة «المسموح والممنوع في سياسة جوجل» عشان تقييماتك متتمسحش',
        'هدية المرونة: تعديل رابط فرعك أونلاين في أي وقت بدون إعادة طباعة',
        'ضمان KUWI الذهبي: 365 يوم استبدال أو استرداد كامل للمبلغ',
      ],
    },
    {
      name: 'باقة الفريق',
      badge: 'الأكثر اختياراً • أعلى قيمة',
      price: '890',
      unit: 'ج.م دفعة واحدة للأبد',
      featured: true,
      href: orderTeam,
      items: [
        '3 كروت KUWI الذكية (كارت للكاشير + كارتين للويتر أو الاستقبال عشان التقييم يتم في لحظتها)',
        'هدية فحص Google Business Profile: مراجعة سريعة لصفحتك وتوصيات تطلعك في أول 3 نتائج',
        'هدية سكريبت الـ 10 ثواني للموظفين: إزاي يطلب التقييم بشياكة ومن غير إحراج',
        'هدية قوالب الردود الجاهزة بالمصري: ردود جاهزة على التقييمات والشكاوى توفر وقتك كل يوم',
        'هدية ورقة سياسة جوجل + تعديل الرابط مدى الحياة بدون اشتراك',
        'ضمان KUWI الذهبي: 365 يوم استبدال أو استرداد كامل للمبلغ',
      ],
    },
    {
      name: 'باقة الفروع',
      badge: 'للمطاعم والعيادات متعددة الفروع',
      price: '2,500',
      unit: 'ج.م دفعة واحدة للأبد',
      featured: false,
      href: orderBranches,
      items: [
        '10 كروت KUWI الذكية متوزعة على كل فروعك وكاشيراتك',
        'هدية التتبع لكل فرع: ربط منفصل لكل فرع عشان تعرف عدد المسحات الفعلي في كل مكان',
        'هدية كارت بيزنس ذكي لصاحب البراند بأرقامك وحساباتك مجاناً',
        'شاملة كل هدايا باقة الفريق (فحص الفروع + سكريبت الموظفين + قوالب الرد + ورقة السياسة)',
        'أولوية دعم واتساب وضمان استبدال فوري لمدة 365 يوم',
      ],
    },
  ];

  const faqs = [
    {
      q: 'هل العميل محتاج يحمّل تطبيق أو يعمل بحث عن المحل؟',
      a: 'لا خالص. مجرد ما يقرّب موبايله من الكارت أو يمسح الـ QR اللي على الضهر، صفحة التقييم على جوجل ماب بتفتح في ثانية من غير أي تطبيق أو خطوات زيادة.',
    },
    {
      q: 'طيب لو عميل معاه موبايل قديم ومفيهوش NFC؟',
      a: 'مفيش أي مشكلة — كل كارت من KUWI مطبوع على ضهره رمز QR احتياطي شغال بكاميرا أي موبايل قديم أو حديث، يعني ولا عميل واحد هيفوتك.',
    },
    {
      q: 'هل في اشتراك شهري أو سنوي بعد ما أشتري الكارت؟',
      a: 'أبداً. بتدفع تمن الكارت مرة واحدة بس، والربط والصفحة وتعديل اللينك مستقبلاً مجاني مدى الحياة من غير أي مصاريف مخفية.',
    },
    {
      q: 'إزاي بتضمنوا إن التقييمات متتمسحش أو تخالف سياسة جوجل؟',
      a: 'بنبعتلك مع الكارت ورقة «المسموح والممنوع في جوجل» عشان التقييمات تطلع 100% طبيعية وقانونية من زباينك جوه المكان، وده بيخلي تقييماتك ثابتة وبتزود ترتيبك بأمان.',
    },
    {
      q: 'يعني إيه ضمان 365 يوم؟',
      a: 'معاك سنة كاملة تجربة حقيقية على الكاشير؛ لو الكارت وقف أو ما شوفتش زيادة حقيقية في تقييماتك، تستبدله أو تسترد فلوسك كاملة من غير لف ودوران.',
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
        {/* Hero: Joanna Wiebe / Alex Cattoni Egyptian VoC Pain-First Hook */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 flex flex-col gap-5 text-right">
              <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C8FF2E] text-xs font-semibold">
                <StarIcon size={14} />
                <span>بدون اشتراك سنوي • بدون تطبيقات • NFC + QR على نفس الكارت</span>
              </div>

              <h1
                className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                منافسك اللي أقل منك في الشغل بياخد زباينك من جوجل ماب…{' '}
                <span className="text-[#C8FF2E]">لمجرد إن تقييماته أكتر وأحدث!</span>
              </h1>

              <p className="text-base text-neutral-300 leading-relaxed">
                الزبون المبسوط بيمشي من عندك وينسى يقيّمك، إنما الزبون المتضايق بيدخل يكتب نجمة واحدة في ساعتها! بكارت{' '}
                <strong className="text-white">KUWI الذكي</strong>، الكاشير بيقرّب الكارت من موبايل العميل المبسوط وهو لسه مبتسم — في 3 ثواني بالظبط بيفتحله صفحة الـ 5 نجوم على جوجل ماب قبل ما يخرج من الباب.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="#pricing"
                  className="min-h-[52px] px-7 py-3.5 bg-[#C8FF2E] hover:brightness-95 active:scale-[0.98] text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>شوف الباقات والهدايا</span>
                  <ArrowUpLeftIcon size={18} />
                </a>
                <a
                  href={orderTeam}
                  className="min-h-[52px] px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>اطلب باقة الفريق على واتساب</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  يشتغل على آيفون وأندرويد فوراً
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  تأسيس وبرمجة كاملة من KUWI
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  ضمان استبدال واسترداد 365 يوم
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
                    <div className="text-xs font-bold text-[#C8FF2E]">كارت KUWI الذكي (NFC + QR على الضهر)</div>
                    <div className="text-[11px] text-neutral-300">
                      تصميم عالي التباين يشد عين العميل • بيفتح نافذة التقييم مباشرة في 3 ثواني
                    </div>
                  </div>
                  <QrCodeIcon size={20} className="text-[#C8FF2E] shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Pain & VoC Proof Section */}
        <section className="py-14 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {marketPains.map((pain) => (
              <div key={pain.title} className="bg-[#181824] border border-white/10 rounded-3xl p-6">
                <div className="text-[11px] font-bold text-[#C8FF2E] mb-2">{pain.tag}</div>
                <h2 className="text-base font-bold text-white mb-2">{pain.title}</h2>
                <p className="text-xs text-neutral-300 leading-relaxed">{pain.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* StoryBrand 3-Step Plan */}
        <section className="py-14 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              إزاي بتشتغل معانا في <span className="text-[#C8FF2E]">3 خطوات بسيطة؟</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {planSteps.map((s) => (
                <div key={s.num} className="bg-[#14141D] border border-white/10 rounded-3xl p-6">
                  <div className="text-2xl font-bold font-mono text-[#C8FF2E] mb-2">{s.num}</div>
                  <h3 className="text-base font-bold text-white mb-1.5">{s.title}</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hormozi Pure Value Stacking (Zero Discounts, Zero Acrylic Stands) */}
        <section id="pricing" className="py-20 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7C3AED]/25 text-[#C8FF2E] text-xs font-bold mb-3">
                <SparklesIcon size={14} />
                <span>باقات مكدّسة بالهدايا التشغيلية — دفعة واحدة للأبد</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                اختار الباقة اللي تكبّر تقييمات مكانك أسرع
              </h2>
              <p className="text-sm text-neutral-400">
                كل باقة بتوصلك مبرمجة وجاهزة للشغل مع كل هدايا التأسيس والتشغيل — وعميلين بس من جوجل ماب يغطوا تمنها طول العمر
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
              <span>ضمان KUWI الذهبي: 365 يوم كاملة تجربة حقيقية أو استرداد كامل — شحن سريع لجميع المحافظات</span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">أسئلة بتيجي في بالك قبل ما تطلب</h2>
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
