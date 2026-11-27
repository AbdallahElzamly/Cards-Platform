import type { Metadata } from 'next';
import Link from 'next/link';
import { getKuwiOrderHref } from '@/lib/brand-config';
import {
  ArrowUpLeftIcon,
  BuildingIcon,
  CheckIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'حلول وكروت الشركات والمؤسسات من KUWI — هوية واحدة وصندوق عملاء موحّد',
  description:
    'زوّد فريق مبيعاتك بكروت NFC ذكية مع بوابة إدارة مركزية: نقل عهدة الموظف المستقيل بضغطة زر بدون إعادة طباعة، والاحتفاظ بكل العملاء المحتملين في Excel.',
};

export default function BusinessLandingPage() {
  const quoteSmall = getKuwiOrderHref(
    'أهلاً فريق KUWI، نرغب في عرض سعر لباقة الشركات (5 إلى 15 موظف).',
    'عرض سعر شركات — باقة 5-15 موظف'
  );
  const quoteMid = getKuwiOrderHref(
    'أهلاً فريق KUWI، نرغب في عرض سعر لباقة الشركات (16 إلى 50 موظف — الأكثر طلباً).',
    'عرض سعر شركات — باقة 16-50 موظف'
  );
  const quoteEnterprise = getKuwiOrderHref(
    'أهلاً فريق KUWI، نرغب في عرض سعر لباقة المؤسسات الكبرى (أكثر من 50 موظف).',
    'عرض سعر مؤسسات كبرى 50+ موظف'
  );

  const pillars = [
    {
      title: 'هوية واحدة موحّدة ومقفلة على كل كارت',
      desc: 'شعار شركتك وألوانك موحّدة على جميع كروت الموظفين مع صلاحية مركزية للـ HR للتحكم فيما يظهر وما يُخفى على كل بطاقة.',
    },
    {
      title: 'احتفظ بكل العملاء حتى لو غادر الموظف',
      desc: 'استقال مندوب مبيعات؟ بضغطة زر واحدة انقل عهدة الكارت للموظف الجديد — نفس الكارت المطبوع يستمر بالعمل، وبيانات العملاء تبقى ملكاً للشركة.',
    },
    {
      title: 'كل عميل محتمل (Lead) في صندوق واحد + Excel',
      desc: 'لا تضيع بطاقات المعارض والاجتماعات بعد اليوم؛ كل عميل يتواصل مع أي موظف يُحفظ تلقائياً في بوابة شركتك مع تصدير فوري لـ Excel CRM.',
    },
  ];

  const slabs = [
    {
      name: 'باقة الفرق الصاعدة',
      range: '5 – 15 موظف',
      badge: 'للشركات الناشئة والمكاتب',
      featured: false,
      href: quoteSmall,
      items: [
        'طباعة وبرمجة 5 إلى 15 كارت NFC بشعار شركتك',
        'بوابة إدارة مستقلة للشركة (/org/your-company)',
        'نقل عهدة الموظفين بضغطة زر بدون إعادة طباعة',
        'تصدير جميع Leads الفريق إلى Excel CSV',
      ],
    },
    {
      name: 'باقة فرق المبيعات (الأكثر طلباً)',
      range: '16 – 50 موظف',
      badge: 'خصم كميات حتى 30%',
      featured: true,
      href: quoteMid,
      items: [
        'طباعة وبرمجة 16 إلى 50 كارت NFC بشعار وهوية شركتك',
        'تأسيس كامل للبيانات من فريق KUWI قبل التسليم',
        'قياس أداء كل موظف (عدد المسحات والعملاء المكتسبين)',
        '3 كروت تقييمات جوجل مجانية لفروع شركتك (هدية)',
        'ضمان استبدال واسترجاع لمدة 365 يوماً',
      ],
    },
    {
      name: 'باقة المؤسسات الكبرى',
      range: '50+ موظف',
      badge: 'تخصيص كامل للشركات الكبرى',
      featured: false,
      href: quoteEnterprise,
      items: [
        'تسعير خاص للكميات الكبيرة وتصاميم مخصصة لكل قسم',
        'مدير حساب مخصص لتسليم وتدريب فريق الموارد البشرية',
        'كروت احتياطية فورية للتعيينات الجديدة',
        'أولوية شحن ودعم فني طوال العام',
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
            <Link href="/individuals" className="hover:text-white transition">كروت الأفراد</Link>
            <Link href="/business" className="text-[#C8FF2E] font-semibold">حلول الشركات</Link>
            <Link href="/restaurants" className="hover:text-white transition">ولاء المطاعم</Link>
          </div>
          <a
            href="#slabs"
            className="min-h-[40px] px-4 py-2 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
          >
            <span>اطلب عرض سعر لشركتك</span>
            <ArrowUpLeftIcon size={14} />
          </a>
        </nav>
      </header>

      <main>
        <section className="pt-12 pb-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <span className="self-start px-3.5 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C8FF2E] text-xs font-semibold inline-flex items-center gap-1.5">
                <BuildingIcon size={14} />
                <span>هوية واحدة • صندوق عملاء واحد • صفر إعادة طباعة</span>
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white" style={{ textWrap: 'balance' }}>
                احتفظ بعملاء فريق مبيعاتك حتى عندما يغادر الموظف{' '}
                <span className="text-[#C8FF2E]">داخل بوابة شركة واحدة</span>
              </h1>
              <p className="text-base text-neutral-300 leading-relaxed">
                لا تخسر علاقات شركتك ولا تعيد طباعة الكروت مع كل تعيين أو استقالة. مع <strong className="text-white">KUWI Corporate Fleet</strong>، تدير كل كروت موظفيك من لوحة ويب واحدة، تنقل العهدة في 5 ثوانٍ، وتصدّر كل عملاء المعارض والاجتماعات إلى Excel بضغطة واحدة.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="#slabs"
                  className="min-h-[52px] px-7 py-3.5 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>شاهد باقات الشركات واطلب عرض سعر</span>
                  <ArrowUpLeftIcon size={18} />
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#15151F] border border-[#7C3AED]/40 rounded-3xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#C8FF2E]">بوابة إدارة أسطول الشركة</span>
                <UsersIcon size={18} className="text-[#A78BFA]" />
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3.5 rounded-2xl bg-[#1F1F2E] border border-white/10">
                  <div className="text-xl font-bold font-mono text-white">50</div>
                  <div className="text-[11px] text-neutral-400">كارت موظف</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#1F1F2E] border border-white/10">
                  <div className="text-xl font-bold font-mono text-[#C8FF2E]">3,240</div>
                  <div className="text-[11px] text-neutral-400">مسحة عميل</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#1F1F2E] border border-white/10">
                  <div className="text-xl font-bold font-mono text-emerald-400">618</div>
                  <div className="text-[11px] text-neutral-400">Lead في Excel</div>
                </div>
              </div>
              <div className="space-y-2 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  <span>نقل عهدة الموظفين بضغطة واحدة بدون إعادة طباعة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  <span>تصدير موحّد لجميع العملاء المحتملين إلى Excel CSV</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-[#C8FF2E]" />
                  <span>تأسيس وبرمجة كاملة من فريق KUWI قبل التسليم</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {pillars.map((p) => (
              <div key={p.title} className="bg-[#181824] border border-white/10 rounded-3xl p-6">
                <h2 className="text-base font-bold text-[#C8FF2E] mb-2">{p.title}</h2>
                <p className="text-xs text-neutral-300 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* B2B Pricing Slabs */}
        <section id="slabs" className="py-20 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-10">
              شرائح التسعير للشركات والمؤسسات
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {slabs.map((slab) => (
                <div
                  key={slab.name}
                  className={`rounded-3xl p-7 flex flex-col justify-between gap-6 border ${
                    slab.featured ? 'bg-[#181628] border-[#C8FF2E]' : 'bg-[#14141D] border-white/10'
                  }`}
                >
                  <div>
                    <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-4 ${slab.featured ? 'bg-[#C8FF2E] text-[#0B0B0F]' : 'bg-[#7C3AED]/20 text-[#C8FF2E]'}`}>
                      {slab.badge}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-1">{slab.name}</h3>
                    <div className="text-2xl font-bold font-mono text-[#C8FF2E] mb-5">{slab.range}</div>
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
                    <span>اطلب عرض السعر الآن</span>
                    <ArrowUpLeftIcon size={16} />
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-neutral-200 text-center">
              <ShieldIcon size={18} className="text-[#C8FF2E] shrink-0" />
              <span>تجهيز كامل لبوابة شركتك + شحن الكروت المطبوعة خلال 48 ساعة • ضمان 365 يوماً</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
