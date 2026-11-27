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
  title: 'كروت الشركات وإدارة أسطول المبيعات من KUWI — احتفظ بعملاء شركتك للأبد',
  description:
    'بوابة واحدة لإدارة كروت موظفيك: لما موظف مبيعات يسيب الشغل تنقل عهدة الكارت لموظف جديد في 5 ثواني من غير إعادة طباعة وتحتفظ بكل عملاء المعارض في Excel.',
};

export default function BusinessLandingPage() {
  const quoteSmall = getKuwiOrderHref(
    'أهلاً فريق KUWI، عايزين عرض تأسيس باقة الفرق الصاعدة للشركات (5 إلى 15 موظف).',
    'طلب باقة الشركات 5-15 موظف'
  );
  const quoteMid = getKuwiOrderHref(
    'أهلاً فريق KUWI، عايزين باقة فرق المبيعات للشركات (16 إلى 50 موظف + هدايا التأسيس وكروت جوجل).',
    'طلب باقة فرق المبيعات 16-50 موظف'
  );
  const quoteEnterprise = getKuwiOrderHref(
    'أهلاً فريق KUWI، عايزين عرض باقة المؤسسات الكبرى (أكثر من 50 موظف).',
    'طلب باقة المؤسسات الكبرى 50+ موظف'
  );

  const pillars = [
    {
      title: 'لما موظف يمشي… الكارت والعملاء بيفضلوا للشركة',
      desc: 'من لوحة تحكم الـ HR، بضغطة زر بتنقل عهدة الكارت المطبوع باسم الموظف الجديد في 5 ثواني — صفر إعادة طباعة وصفر هدر لفلوس الشركة.',
    },
    {
      title: 'أرقام كل عملاء المعارض والاجتماعات في ملف Excel واحد',
      desc: 'بدل ما المندوبين ياخدوا كروت ورقية وتضيع منهم أو ينسوا يتابعوا، كل عميل بيتواصل مع أي موظف بيتسجل لحظياً جوه بوابة شركتك وجاهز للتصدير للـ CRM.',
    },
    {
      title: 'هوية واحدة محترمة ومقفولة على كل الفريق',
      desc: 'شعار شركتك وألوانها موحدة على كل الكروت، وتأسيس بيانات كل الموظفين بيتم بالكامل من فريق KUWI قبل التسليم.',
    },
  ];

  const slabs = [
    {
      name: 'باقة الفرق الصاعدة',
      range: '5 – 15 موظف',
      badge: 'للشركات النامية والمكاتب',
      featured: false,
      href: quoteSmall,
      items: [
        '5 إلى 15 كارت KUWI الذكي (NFC + QR) مطبوعين بشعار وهوية شركتك',
        'هدية بوابة الشركة المستقلة (/org/company-name) لإدارة الفريق والعملاء',
        'هدية التأسيس: رفع وتجهيز بيانات موظفيك بالكامل قبل التسليم',
        'ميزة نقل العهدة بضغطة زر + تصدير Leads الفريق إلى Excel',
        'ضمان KUWI الذهبي: 365 يوم استبدال أو استرداد كامل',
      ],
    },
    {
      name: 'باقة فرق المبيعات',
      range: '16 – 50 موظف',
      badge: 'الأكثر اختياراً • أعلى عائد للشركات',
      featured: true,
      href: quoteMid,
      items: [
        '16 إلى 50 كارت KUWI الذكي (NFC + QR) بهوية شركتك الكاملة',
        'هدية التأسيس الشامل: تجهيز كل بروفايلات الفريق وتدريب مسؤول الـ HR',
        'هدية 3 كروت تقييمات جوجل الذكية لفروع ومقر شركتك مجاناً',
        'هدية لوحة قياس أداء المبيعات: تابع عدد المسحات والعملاء لكل موظف',
        'نقل العهدة الفوري بدون إعادة طباعة + ضمان استبدال 365 يوم',
      ],
    },
    {
      name: 'باقة المؤسسات الكبرى',
      range: '50+ موظف',
      badge: 'حلول مخصصة للشركات والهيئات',
      featured: false,
      href: quoteEnterprise,
      items: [
        'تصميم خاص لكل قسم وإدارة مع صلاحيات تحكم للـ HR',
        'هدية كروت احتياطية إضافية جاهزة للتعيينات الجديدة فوراً',
        'هدية 5 كروت تقييمات جوجل الذكية لفروع ومراكز الخدمة',
        'مدير حساب مخصص + أولوية شحن ودعم فني طوال السنة',
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
            <span>اختر باقة شركتك</span>
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
                مندوب المبيعات ساب الشغل وخد معاه عملاء الشركة…{' '}
                <span className="text-[#C8FF2E]">وكروته اترمت؟</span>
              </h1>
              <p className="text-base text-neutral-300 leading-relaxed">
                ما تخسرش علاقات شركتك ولا ترمي كروت مطبوعة تاني. مع <strong className="text-white">KUWI Corporate Fleet</strong>، كل موظف معاه كارت ذكي مربوط ببوابة الشركة: لو ساب الشغل بتنقل نفس الكارت للموظف الجديد في 5 ثواني، وكل عملاء المعارض والاجتماعات بيتجمعوا في ملف Excel واحد باسم شركتك.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="#slabs"
                  className="min-h-[52px] px-7 py-3.5 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>شوف باقات وهدايا الشركات</span>
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
                  <span>تصدير موحّد لكل العملاء المحتملين إلى Excel CSV</span>
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

        {/* Hormozi B2B Value Stack Slabs */}
        <section id="slabs" className="py-20 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-10">
              باقات الشركات المكدّسة بالقيمة والأمان الكامل
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
                    <span>اطلب تأسيس الباقة الآن</span>
                    <ArrowUpLeftIcon size={16} />
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-neutral-200 text-center">
              <ShieldIcon size={18} className="text-[#C8FF2E] shrink-0" />
              <span>تجهيز كامل لبوابة شركتك + شحن الكروت المطبوعة خلال 48 ساعة • ضمان 365 يوم</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
