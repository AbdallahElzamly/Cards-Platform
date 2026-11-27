import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpLeftIcon,
  BuildingIcon,
  CheckIcon,
  ShieldIcon,
  UsersIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'حلول وكروت الشركات والمؤسسات من KUWI — إدارة أسطول المبيعات بمركزية كاملة',
  description:
    'زوّد فريق مبيعاتك بكروت NFC ذكية مع بوابة إدارة مركزية: نقل عهدة الموظف المستقيل بضغطة زر بدون إعادة طباعة، وتصدير كل العملاء المحتملين إلى Excel.',
};

const WHATSAPP_B2B =
  'https://wa.me/201112708046?text=' +
  encodeURIComponent('أهلاً فريق KUWI، نرغب في عرض سعر لباقة كروت الشركات وإدارة أسطول الموظفين.');

export default function BusinessLandingPage() {
  const pillars = [
    {
      title: 'نقل عهدة الموظف في 5 ثوانٍ بدون إعادة طباعة',
      desc: 'غادر موظف المبيعات الشركة؟ من لوحة الـ HR انقل الكارت فوراً للموظف الجديد — نفس الكارت المطبوع يستمر بالعمل وتحتفظ الشركة بكل علاقاتها وعملائها.',
    },
    {
      title: 'تحويل كل معرض واجتماع إلى قائمة Leads في Excel',
      desc: 'نموذج تبادل البيانات على بطاقة كل موظف يجمع أرقام العملاء المحتملين تلقائياً في بوابة الشركة المركزية مع زر تصدير فوري لـ Excel CRM.',
    },
    {
      title: 'هوية بصرية موحدة وطباعة بشعار شركتك',
      desc: 'تصميم موحد يعكس قوة علامتك التجارية مع تحكم كامل في صلاحيات كل موظف وقياس دقيق لأداء فريق المبيعات من عدد المسحات والعملاء.',
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
            href={WHATSAPP_B2B}
            target="_blank"
            rel="noopener noreferrer"
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
                <span>لإدارات المبيعات والـ HR والشركات النامية</span>
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white" style={{ textWrap: 'balance' }}>
                أوقف هدر طباعة الكروت واحتفظ بعملاء فريقك{' '}
                <span className="text-[#C8FF2E]">داخل بوابة شركة واحدة</span>
              </h1>
              <p className="text-base text-neutral-300 leading-relaxed">
                مع بوابة <strong className="text-white">KUWI Corporate Fleet</strong>، تحصل شركتك على لوحة تحكم مستقلة لإدارة كروت الموظفين، نقل العهدة فور استقالة أي موظف بدون إعادة طباعة، وجمع بيانات العملاء من المعارض والاجتماعات في ملف Excel واحد.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={WHATSAPP_B2B}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[52px] px-7 py-3.5 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <WhatsAppIcon size={19} />
                  <span>احصل على عرض سعر مخصص لفريقك</span>
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
                  <div className="text-[11px] text-neutral-400">Lead محفوظ</div>
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

        <section className="py-16 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {pillars.map((p) => (
              <div key={p.title} className="bg-[#181824] border border-white/10 rounded-3xl p-6">
                <h2 className="text-base font-bold text-[#C8FF2E] mb-2">{p.title}</h2>
                <p className="text-xs text-neutral-300 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm text-white">
              <ShieldIcon size={20} className="text-[#C8FF2E] shrink-0" />
              <span>تجهيز كامل لبوابة شركتك + شحن الكروت المطبوعة خلال 48 ساعة • ضمان 365 يوماً</span>
            </div>
            <a
              href={WHATSAPP_B2B}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[48px] px-6 py-3 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-sm rounded-xl inline-flex items-center gap-2 shrink-0"
            >
              <WhatsAppIcon size={17} />
              <span>تواصل مع مبيعات الشركات</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
