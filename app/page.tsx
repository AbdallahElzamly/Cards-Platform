import Link from 'next/link';
import TaglineReveal from '@/components/landing/TaglineReveal';
import {
  ArrowUpLeftIcon,
  BuildingIcon,
  CheckIcon,
  CreditCardIcon,
  DownloadIcon,
  InstagramIcon,
  LinkedInIcon,
  PhoneIcon,
  QrCodeIcon,
  ShieldIcon,
  SparklesIcon,
  UsersIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';

export default function Home() {
  const faqItems = [
    {
      q: 'هل يحتاج الشخص الذي يمسح الكارت إلى تحميل أي تطبيق؟',
      a: 'لا نهائياً. بمجرد تقريب الكارت من ظهر الهاتف أو مسح رمز QR تفتح صفحتك الرقمية مباشرة على متصفح iPhone أو Android في أقل من ثانية.',
    },
    {
      q: 'ماذا يحدث لو غادر موظف الشركة ومعه كارت العمل؟',
      a: 'من لوحة تحكم الشركة يمكنك نقل عهدة الكارت لموظف جديد بضغطة زر مع مسح أو الاحتفاظ بسجل العملاء، ويستمر نفس الكارت المطبوع بالعمل دون تكلفة إعادة طباعة.',
    },
    {
      q: 'هل يمكنني إضافة أكثر من رقم هاتف وحسابات لينكدإن وإنستجرام وفيسبوك؟',
      a: 'نعم، يدعم الكارت رقمين للهاتف، واتساب مباشر، حفظ جهة الاتصال (.vcf)، لينكدإن، إنستجرام، فيسبوك، تيك توك، الموقع الجغرافي، ومحافظ فودافون كاش وانستاباي.',
    },
    {
      q: 'ماذا لو ضاع الكارت الشخصي مني؟',
      a: 'فعّل وضع الكارت المفقود من لوحة تحكمك، وعندما يمسحه أي شخص ستظهر له رسالة تنبيه فورية للاتصال بك وإعادته إليك.',
    },
    {
      q: 'كيف أعدّل بياناتي بعد استلام الكارت؟',
      a: 'تستلم رابط حسابك الخاص لتدخل في أي وقت من موبايلك وتحدّث أرقامك أو مسماك الوظيفي أو صورتك وتظهر التعديلات في نفس اللحظة.',
    },
    {
      q: 'ما تفاصيل ضمان 365 يوماً؟',
      a: 'معك سنة كاملة ضمان استرجاع واسترداد كامل المبلغ لأي سبب، حتى بعد الطباعة والتشغيل، مع تحديثات برمجية مستمرة مجاناً.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans antialiased" dir="rtl">
      {/* B7 Floating Compact Translucent Navigation */}
      <header className="sticky top-4 z-40 px-4">
        <nav
          aria-label="التنقل الرئيسي"
          className="max-w-4xl mx-auto bg-[#181818]/85 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between"
        >
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#C8FF2E] text-[#0B0B0F] font-bold text-sm flex items-center justify-center">
              K
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">KUWI</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 text-xs font-medium text-neutral-300">
            <Link href="/google-reviews" className="hover:text-[#C8FF2E] transition duration-300">
              تقييمات جوجل
            </Link>
            <Link href="/individuals" className="hover:text-[#C8FF2E] transition duration-300">
              الأفراد
            </Link>
            <Link href="/business" className="hover:text-[#C8FF2E] transition duration-300">
              الشركات
            </Link>
            <Link href="/restaurants" className="hover:text-[#C8FF2E] transition duration-300">
              ولاء المطاعم
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              دخول
            </Link>
            <Link
              href="/auth/login?mode=signup"
              className="py-2 px-3.5 bg-[#C8FF2E] hover:brightness-95 active:scale-[0.98] text-[#0B0B0F] text-xs font-bold rounded-xl transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              ابدأ بطاقتك مجاناً
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* A2 & B5 Above-the-Fold Hero Section */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            {/* Hero Heading: Capped at 680px, Text-only Gradient (#FFFFFF -> #9B9B9B), No periods */}
            <h1
              className="max-w-[680px] text-4xl sm:text-6xl font-semibold tracking-tight leading-tight bg-gradient-to-l from-white to-[#9B9B9B] bg-clip-text text-transparent mb-6"
              style={{ textWrap: 'balance' }}
            >
              شارك هويتك المهنية وأدر أسطول شركتك
              <br />
              بلمسة كارت واحدة
            </h1>

            <p
              className="max-w-[680px] text-base sm:text-lg text-neutral-400 leading-relaxed mb-8"
              style={{ textWrap: 'pretty' }}
            >
              منصة كوي الموحدة لكروت الأعمال الذكية للأفراد، وبوابات إدارة فرق المبيعات للشركات، ونظام ولاء المطاعم عبر شرائح NFC ورموز QR الديناميكية بدون تطبيقات.
            </p>

            {/* Single Primary CTA + 4 Dedicated Ad Landing Page Pills */}
            <div className="flex flex-col items-center gap-4 mb-16">
              <Link
                href="/dashboard"
                className="min-h-[48px] py-3 px-6 bg-[#C8FF2E] hover:brightness-95 active:scale-[0.98] text-[#0B0B0F] text-base font-bold rounded-xl transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] inline-flex items-center gap-2"
              >
                <span>افتح لوحة التحكم وابدأ الآن</span>
                <ArrowUpLeftIcon size={18} />
              </Link>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Link
                  href="/google-reviews"
                  className="px-3.5 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 hover:border-[#C8FF2E] text-xs font-semibold text-[#C8FF2E] transition"
                >
                  ⭐ كارت تقييمات جوجل
                </Link>
                <Link
                  href="/individuals"
                  className="px-3.5 py-1.5 rounded-full bg-[#181818] border border-white/10 hover:border-[#C8FF2E] text-xs font-medium text-neutral-200 transition"
                >
                  👤 كارت الأفراد
                </Link>
                <Link
                  href="/business"
                  className="px-3.5 py-1.5 rounded-full bg-[#181818] border border-white/10 hover:border-[#C8FF2E] text-xs font-medium text-neutral-200 transition"
                >
                  🏢 كروت الشركات
                </Link>
                <Link
                  href="/restaurants"
                  className="px-3.5 py-1.5 rounded-full bg-[#181818] border border-white/10 hover:border-[#C8FF2E] text-xs font-medium text-neutral-200 transition"
                >
                  🍽️ نظام ولاء المطاعم
                </Link>
              </div>

              <p className="text-xs text-neutral-500">
                يعمل فوراً على جميع هواتف iPhone و Android • ضمان استرجاع 365 يوماً
              </p>
            </div>

            {/* Interactive Product Preview: Individual Card + Corporate Fleet Console */}
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 text-right">
              {/* Left Preview: Individual Executive Smart Card */}
              <div className="lg:col-span-5 bg-[#181818] border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-[#272727] border border-white/10 text-xs text-neutral-300 font-medium">
                    كارت الأفراد والمهندسين
                  </span>
                  <QrCodeIcon size={18} className="text-neutral-400" />
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#272727] border border-white/10 mx-auto mb-3 flex items-center justify-center text-xl font-semibold text-white">
                    A
                  </div>
                  <div className="text-lg font-semibold text-white">Eng. Ahmed Wasim</div>
                  <div className="text-xs text-neutral-400 mt-0.5">Electrical Power Engineer</div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="py-2.5 px-4 bg-white text-neutral-950 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                    <DownloadIcon size={15} />
                    <span>حفظ جهة الاتصال (.vcf)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#272727] border border-white/10 text-xs flex items-center justify-between">
                      <span>اتصال 1 و 2</span>
                      <PhoneIcon size={14} className="text-neutral-400" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#272727] border border-white/10 text-xs flex items-center justify-between">
                      <span>واتساب</span>
                      <WhatsAppIcon size={14} className="text-emerald-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#272727] border border-white/10 text-xs flex items-center justify-between text-neutral-300">
                      <span>LinkedIn</span>
                      <LinkedInIcon size={14} />
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#272727] border border-white/10 text-xs flex items-center justify-between text-neutral-300">
                      <span>Instagram</span>
                      <InstagramIcon size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Preview: Multi-Tenant Company Fleet Dashboard */}
              <div className="lg:col-span-7 bg-[#181818] border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-1 rounded-full bg-[#272727] border border-white/10 text-xs text-neutral-300 font-medium">
                      بوابة الشركات وإدارة الأسطول
                    </span>
                    <h2 className="text-lg font-semibold text-white mt-3">
                      تحكم مركزي كامل في كروت موظفيك والعملاء المحتملين
                    </h2>
                  </div>
                  <BuildingIcon size={22} className="text-neutral-400 shrink-0" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[#272727] border border-white/10">
                    <div className="text-xs text-neutral-400 mb-1">كروت الفريق</div>
                    <div className="text-2xl font-semibold font-mono text-white">24</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#272727] border border-white/10">
                    <div className="text-xs text-neutral-400 mb-1">مسحات الكروت</div>
                    <div className="text-2xl font-semibold font-mono text-white">1,482</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#272727] border border-white/10">
                    <div className="text-xs text-neutral-400 mb-1">عملاء مسجلون</div>
                    <div className="text-2xl font-semibold font-mono text-emerald-400">319</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#1F1F1F] border border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">نقل عهدة الموظفين بدون إعادة طباعة</span>
                    <span className="text-emerald-400 font-medium">تحديث لحظي</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    كل شركة تحصل على بوابة مستقلة لإضافة موظفيها، تعديل صلاحياتهم، وتصدير بيانات العملاء المتواصلين مع فريق المبيعات إلى Excel بضغطة واحدة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* B11 Mandatory Word-by-Word Tagline Reveal */}
        <TaglineReveal
          lines={[
            'اطبع البطاقة مرة واحدة فقط',
            'وغيّر بياناتك أو انقل عهدة موظفيك في ثوانٍ بدون أي تطبيقات',
          ]}
        />

        {/* Asymmetric Bento Benefits Section */}
        <section id="solutions" className="py-20 sm:py-24 px-4 sm:px-6 bg-[#000000]">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-[680px] mb-12">
              <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3" style={{ textWrap: 'balance' }}>
                معمارية مصممة للأفراد والشركات والمطاعم
              </h2>
              <p className="text-base text-neutral-400 leading-relaxed">
                كل عميل يدير حسابه أو شركته باستقلالية كاملة دون انتظار الدعم الفني لتعديل رقم أو رابط.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Card 1: 7 cols */}
              <article className="md:col-span-7 bg-[#181818] border border-white/10 rounded-3xl p-8 flex flex-col justify-between gap-6">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#272727] border border-white/10 flex items-center justify-center text-white mb-5">
                    <CreditCardIcon size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    كروت الأعمال الشخصية للأفراد والمهنيين
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    صفحة هوية رقمية سريعة تجمع رقمي هاتفك، واتساب، لينكدإن، فيسبوك، إنستجرام، السيرة الذاتية، ومحافظ الدفع مع زر حفظ جهة الاتصال المباشر على الهاتف.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
                  <span className="px-3 py-1.5 rounded-xl bg-[#272727] border border-white/10">حفظ .vcf فوري</span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#272727] border border-white/10">رقمان للموبايل</span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#272727] border border-white/10">وضع استرداد المفقود</span>
                </div>
              </article>

              {/* Card 2: 5 cols */}
              <article className="md:col-span-5 bg-[#181818] border border-white/10 rounded-3xl p-8 flex flex-col justify-between gap-6">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#272727] border border-white/10 flex items-center justify-center text-white mb-5">
                    <UsersIcon size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    أسطول الشركات ونقل العهدة
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    لوحة مستقلة لمدير الموارد البشرية أو المبيعات لتعيين الكروت للموظفين، مراقبة المسحات، وتجميع كافة بيانات العملاء في شيت موحد.
                  </p>
                </div>
                <Link
                  href="/auth/login"
                  className="text-xs font-semibold text-white inline-flex items-center gap-1.5 hover:underline"
                >
                  <span>دخول مسؤولي الشركات المتعاقدة</span>
                  <ArrowUpLeftIcon size={14} />
                </Link>
              </article>

              {/* Card 3: 5 cols */}
              <article className="md:col-span-5 bg-[#181818] border border-white/10 rounded-3xl p-8 flex flex-col justify-between gap-6">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#272727] border border-white/10 flex items-center justify-center text-white mb-5">
                    <SparklesIcon size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    نظام ولاء المطاعم والكافيهات
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    برنامج أختام رقمي بكود كاشير يومي متغير، يحفظ أرقام هواتف العملاء لإعادة الاستهداف عبر واتساب والمكالمات التسويقية.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <Link
                    href="/dashboard/loyalty"
                    className="font-semibold text-white inline-flex items-center gap-1 hover:underline"
                  >
                    <span>لوحة المطعم</span>
                    <ArrowUpLeftIcon size={14} />
                  </Link>
                  <Link
                    href="/l/test-cafe"
                    className="text-neutral-400 hover:text-white transition"
                  >
                    معاينة كارت العميل
                  </Link>
                </div>
              </article>

              {/* Card 4: 7 cols */}
              <article className="md:col-span-7 bg-[#181818] border border-white/10 rounded-3xl p-8 flex flex-col justify-between gap-6">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#272727] border border-white/10 flex items-center justify-center text-white mb-5">
                    <ShieldIcon size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    خصوصية انتقائية وتقييمات خرائط جوجل
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    اختر ما يظهر للعامة بضغطة زر عبر قوالب جاهزة لبيانات العمل أو محافظ الدفع، أو حوّل الكارت لبوابة توجيه فوري لتقييمات 5 نجوم على خرائط جوجل.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
                  <span className="px-3 py-1.5 rounded-xl bg-[#272727] border border-white/10">قوالب خصوصية</span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#272727] border border-white/10">تحويل ديناميكي للروابط</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* How It Works (3 Steps) */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 border-t border-white/10 bg-[#000000]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-semibold text-white mb-10">ثلاث خطوات للتشغيل الفوري</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  step: '01',
                  title: 'استلم الكارت أو افتح حساب شركتك',
                  desc: 'كل كارت مزود بشريحة NFC ورمز QR ديناميكي مرتبط بكود فريد ثابت مدى الحياة.',
                },
                {
                  step: '02',
                  title: 'فعّل بياناتك في 30 ثانية',
                  desc: 'امسح الكارت وأدخل أرقامك وحساباتك الاجتماعية أو وزّع الكروت على موظفي شركتك من اللوحة.',
                },
                {
                  step: '03',
                  title: 'شارك بلمسة واجمع بيانات عملائك',
                  desc: 'يحفظ عميلك رقمك في هاتفه فوراً ويترك لك اسمه ورقمه في سجل العملاء الخاص بك.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-[#181818] border border-white/10 rounded-3xl p-7 flex flex-col gap-3"
                >
                  <span className="text-xs font-mono text-neutral-500">{item.step}</span>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Real Pricing & 365-Day Guarantee */}
        <section id="pricing" className="py-20 px-4 sm:px-6 border-t border-white/10 bg-[#000000]">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-[680px] mb-12">
              <h2 className="text-3xl font-semibold text-white mb-3">تسعير واضح وضمان لمدة عام كامل</h2>
              <p className="text-sm text-neutral-400">
                ادفع مرة واحدة للكارت الشخصي بدون اشتراكات شهرية إجبارية، مع ضمان استرجاع 365 يوماً لأي سبب.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#181818] border border-white/10 rounded-3xl p-8 flex flex-col justify-between gap-6">
                <div>
                  <div className="text-sm font-semibold text-neutral-300 mb-2">كارت الأفراد الذكي</div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-semibold font-mono text-white">300</span>
                    <span className="text-sm text-neutral-400">ج.م (شامل التحديثات)</span>
                  </div>
                  <ul className="flex flex-col gap-2.5 text-sm text-neutral-300">
                    <li className="flex items-center gap-2">
                      <CheckIcon size={16} className="text-emerald-400 shrink-0" />
                      <span>شريحة NFC + رمز QR ديناميكي</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={16} className="text-emerald-400 shrink-0" />
                      <span>لوحة تحكم شخصية لتعديل الأرقام والروابط بلا حدود</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={16} className="text-emerald-400 shrink-0" />
                      <span>ضمان استرجاع كامل المبلغ لمدة 365 يوماً لأي سبب</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/auth/login?mode=signup"
                  className="min-h-[48px] py-3 px-5 bg-white hover:bg-neutral-200 text-neutral-950 font-semibold rounded-xl text-sm text-center transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center"
                >
                  إنشاء بطاقتك الفردية الآن
                </Link>
              </div>

              <div className="bg-[#181818] border border-white/10 rounded-3xl p-8 flex flex-col justify-between gap-6">
                <div>
                  <div className="text-sm font-semibold text-neutral-300 mb-2">باقات الشركات والمطاعم</div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-semibold text-white">أسطول مخصص حسب العدد</span>
                  </div>
                  <ul className="flex flex-col gap-2.5 text-sm text-neutral-300">
                    <li className="flex items-center gap-2">
                      <CheckIcon size={16} className="text-emerald-400 shrink-0" />
                      <span>بوابة إدارة أسطول الموظفين ونقل العهدة الفوري</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={16} className="text-emerald-400 shrink-0" />
                      <span>تجميع وتصدير Leads جميع مناديب المبيعات لشيت إكسل</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={16} className="text-emerald-400 shrink-0" />
                      <span>نظام ولاء المطاعم بكود الكاشير اليومي وإعادة الاستهداف</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/auth/login"
                  className="min-h-[48px] py-3 px-5 bg-[#272727] hover:bg-[#313131] border border-white/10 text-white font-semibold rounded-xl text-sm text-center transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center"
                >
                  دخول الشركات والمطاعم المتعاقدة
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Objection-Handling FAQ */}
        <section id="faq" className="py-20 px-4 sm:px-6 border-t border-white/10 bg-[#000000]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-white mb-10">الأسئلة الشائعة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#181818] border border-white/10 rounded-2xl p-6 flex flex-col gap-2"
                >
                  <h3 className="text-sm font-semibold text-white">{item.q}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 border-t border-white/10 bg-[#000000] text-center">
          <div className="max-w-[680px] mx-auto flex flex-col items-center gap-6">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white" style={{ textWrap: 'balance' }}>
              جهّز هويتك الرقمية أو أسطول شركتك اليوم
            </h2>
            <Link
              href="/dashboard"
              className="min-h-[48px] py-3 px-6 bg-white hover:bg-neutral-200 active:scale-[0.98] text-neutral-950 text-base font-semibold rounded-xl transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] inline-flex items-center gap-2"
            >
              <span>افتح لوحة التحكم وابدأ الآن</span>
              <ArrowUpLeftIcon size={18} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-white/10 bg-[#000000] text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>KUWI NFC Platform © 2026 جميع الحقوق محفوظة</span>
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="hover:text-white transition">
              لوحة الأفراد والشركات
            </Link>
            <Link href="/dashboard/loyalty" className="hover:text-white transition">
              ولاء المطاعم
            </Link>
            <Link href="/admin" className="hover:text-white transition">
              الإدارة
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
