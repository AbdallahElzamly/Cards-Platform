import type { Metadata } from 'next';
import Link from 'next/link';
import { getKuwiOrderHref } from '@/lib/brand-config';
import {
  ArrowUpLeftIcon,
  CheckIcon,
  DownloadIcon,
  InstagramIcon,
  LinkedInIcon,
  PhoneIcon,
  ShieldIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'كارت الأعمال الذكي للأفراد من KUWI — بطاقة واحدة ذكية تغنيك عن الطباعة للأبد',
  description:
    'استبدل الكروت الورقية بكارت NFC ذكي من KUWI: رقمان هاتف، واتساب، لينكدإن، حفظ فوري لجهة الاتصال (.vcf)، و5 مظاهر فخمة بضمان 365 يوماً.',
};

export default function IndividualsLandingPage() {
  const orderSingle = getKuwiOrderHref(
    'أهلاً فريق KUWI، أريد طلب كارت الأعمال الذكي للأفراد (300 ج.م).',
    'طلب كارت الأعمال الذكي للأفراد'
  );
  const orderVip = getKuwiOrderHref(
    'أهلاً فريق KUWI، أريد طلب باقة VIP للأفراد (كارتين NFC بتصميم مخصص — 520 ج.م).',
    'طلب باقة VIP للأفراد'
  );

  const perfectFor = [
    'المهندسون والاستشاريون',
    'الأطباء وأصحاب العيادات',
    'مستشارو العقارات والمبيعات',
    'رواد الأعمال والمديرون التنفيذيون',
    'المحامون والمحاسبون',
    'صنّاع المحتوى والمستقلون',
  ];

  const slabs = [
    {
      name: 'الكارت الذكي القياسي',
      badge: 'مثالي للبداية',
      price: '300',
      unit: 'ج.م لمرة واحدة',
      featured: false,
      href: orderSingle,
      items: [
        '1 كارت KUWI NFC + QR فخم مطبوع باسمك',
        'رقمان هاتف + واتساب + جميع روابط السوشيال ميديا',
        'زر حفظ جهة الاتصال (.vcf) بضغطة واحدة',
        'لوحة تحكم شخصية لتعديل بياناتك في أي وقت',
        '5 مظاهر فخمة + وضع استرداد الكارت المفقود',
      ],
    },
    {
      name: 'باقة المحترفين VIP (الأكثر طلباً)',
      badge: 'كارت للعمل + كارت احتياطي • وفر 80 ج.م',
      price: '520',
      unit: 'ج.م بدلاً من 600 ج.م',
      featured: true,
      href: orderVip,
      items: [
        '2 كارت KUWI NFC + QR مربوطان بنفس هويتك الرقمية',
        'تصميم مخصص بشعارك أو لونك المفضل مجاناً',
        'تفعيل فوري لبطاقتك الرقمية قبل وصول الشحن',
        'جمع أرقام العملاء الذين يتواصلون معك داخل لوحتك',
        'ضمان استبدال واسترجاع كامل لمدة 365 يوماً',
      ],
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
            <Link href="/individuals" className="text-[#C8FF2E] font-semibold">كروت الأفراد</Link>
            <Link href="/business" className="hover:text-white transition">حلول الشركات</Link>
            <Link href="/restaurants" className="hover:text-white transition">ولاء المطاعم</Link>
          </div>
          <Link
            href="/auth/login?mode=signup"
            className="min-h-[40px] px-4 py-2 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
          >
            <span>صمّم بطاقتك مجاناً</span>
            <ArrowUpLeftIcon size={14} />
          </Link>
        </nav>
      </header>

      <main>
        <section className="pt-12 pb-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <span className="self-start px-3.5 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C8FF2E] text-xs font-semibold">
                لسه بتطبع كروت ورقية بتترمي بعد أسبوع؟
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white" style={{ textWrap: 'balance' }}>
                بطاقة واحدة ذكية تحفظ رقمك على موبايل عميلك{' '}
                <span className="text-[#C8FF2E]">بلمسة واحدة للأبد</span>
              </h1>
              <p className="text-base text-neutral-300 leading-relaxed">
                88% من الكروت الورقية تُرمى خلال 7 أيام. مع كارت <strong className="text-white">KUWI الذكي للأفراد</strong>، لمسة واحدة على ظهر موبايل عميلك تفتح هويتك المهنية الفخمة ويحفظ رقمك في جهات اتصاله خلال ثانيتين — وتعدل بياناتك من موبايلك في أي وقت بدون إعادة طباعة.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="#pricing"
                  className="min-h-[52px] px-7 py-3.5 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>اطلب كارتك الشخصي الآن</span>
                  <ArrowUpLeftIcon size={18} />
                </a>
                <Link
                  href="/auth/login?mode=signup"
                  className="min-h-[52px] px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>جرّب بناء بطاقتك الرقمية مجاناً</span>
                </Link>
              </div>
            </div>

            {/* Live Proof Executive Card */}
            <div className="lg:col-span-5 bg-[#15151F] border border-[#7C3AED]/40 rounded-3xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="px-2.5 py-1 rounded-full bg-[#7C3AED]/20 text-[#C8FF2E] font-semibold">
                  إثبات حي لبطاقة عميل
                </span>
                <Link href="/c/ahmed-wasim" target="_blank" className="text-[#C8FF2E] underline font-semibold">
                  معاينة البطاقة الحقيقية ↗
                </Link>
              </div>
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-[#7C3AED] text-white font-bold text-xl mx-auto mb-3 flex items-center justify-center">
                  A
                </div>
                <div className="text-lg font-bold text-white">Eng. Ahmed Wasim</div>
                <div className="text-xs text-neutral-400">Electrical Power Engineer</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="py-3 px-4 bg-[#C8FF2E] text-[#0B0B0F] rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <DownloadIcon size={15} />
                  <span>حفظ جهة الاتصال (.vcf)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#1F1F2E] border border-white/10 flex items-center justify-between">
                    <span>اتصال 1 و 2</span>
                    <PhoneIcon size={14} className="text-[#C8FF2E]" />
                  </div>
                  <div className="p-3 rounded-xl bg-[#1F1F2E] border border-white/10 flex items-center justify-between">
                    <span>واتساب</span>
                    <WhatsAppIcon size={14} className="text-emerald-400" />
                  </div>
                  <div className="p-3 rounded-xl bg-[#1F1F2E] border border-white/10 flex items-center justify-between">
                    <span>LinkedIn</span>
                    <LinkedInIcon size={14} className="text-[#A78BFA]" />
                  </div>
                  <div className="p-3 rounded-xl bg-[#1F1F2E] border border-white/10 flex items-center justify-between">
                    <span>Instagram</span>
                    <InstagramIcon size={14} className="text-[#A78BFA]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Perfect For Avatar Callouts */}
        <section className="py-12 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-lg font-bold text-white mb-5">مصممة خصيصاً للمحترفين الذين يصنعون الانطباع الأول</h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              {perfectFor.map((role) => (
                <span
                  key={role}
                  className="px-4 py-2 rounded-full bg-[#181824] border border-white/10 text-xs sm:text-sm font-semibold text-neutral-200"
                >
                  ✓ {role}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Hormozi Pricing Slabs */}
        <section id="pricing" className="py-20 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-10">
              استثمر مرة واحدة — وشارك هويتك <span className="text-[#C8FF2E]">مدى الحياة</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {slabs.map((slab) => (
                <div
                  key={slab.name}
                  className={`rounded-3xl p-7 flex flex-col justify-between gap-6 border ${
                    slab.featured
                      ? 'bg-[#181628] border-[#C8FF2E]'
                      : 'bg-[#14141D] border-white/10'
                  }`}
                >
                  <div>
                    <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-4 ${slab.featured ? 'bg-[#C8FF2E] text-[#0B0B0F]' : 'bg-[#7C3AED]/20 text-[#C8FF2E]'}`}>
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
                      slab.featured ? 'bg-[#C8FF2E] text-[#0B0B0F]' : 'bg-[#7C3AED] text-white'
                    }`}
                  >
                    <span>اطلب {slab.name}</span>
                    <ArrowUpLeftIcon size={16} />
                  </a>
                </div>
              ))}
            </div>
            <div className="mt-8 p-5 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-neutral-200 text-center">
              <ShieldIcon size={18} className="text-[#C8FF2E] shrink-0" />
              <span>ضمان استرجاع 365 يوماً كاملاً — بدون أي اشتراك شهري أو رسوم مخفية</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
