import type { Metadata } from 'next';
import Link from 'next/link';
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
  title: 'كارت الأعمال الذكي للأفراد من KUWI — هويتك المهنية في لمسة واحدة',
  description:
    'استبدل الكروت الورقية بكارت NFC ذكي من KUWI: رقمان هاتف، واتساب، لينكدإن، حفظ فوري لجهة الاتصال (.vcf)، و5 مظاهر فخمة بضمان 365 يوماً.',
};

const WHATSAPP_INDIVIDUAL =
  'https://wa.me/201112708046?text=' +
  encodeURIComponent('أهلاً فريق KUWI، أريد طلب كارت الأعمال الذكي للأفراد (300 ج.م).');

export default function IndividualsLandingPage() {
  const stack = [
    'كارت KUWI NFC + QR فخم مطبوع باسمك وهويتك',
    'رقمان للهاتف + واتساب مباشر + حفظ جهة الاتصال (.vcf) بضغطة واحدة',
    'جميع روابط السوشيال ميديا (LinkedIn, Instagram, Facebook, TikTok) + محفظة انستاباي وفودافون كاش',
    'لوحة تحكم شخصية من موبايلك لتعديل بياناتك في أي لحظة بدون إعادة طباعة',
    '5 مظاهر معمارية احترافية + وضع الكارت المفقود لاسترداد بطاقتك',
    'ضمان استرجاع كامل لمدة 365 يوماً بدون أي اشتراك شهري',
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
            <span>جرّب بطاقتك مجاناً</span>
            <ArrowUpLeftIcon size={14} />
          </Link>
        </nav>
      </header>

      <main>
        <section className="pt-12 pb-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <span className="self-start px-3.5 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C8FF2E] text-xs font-semibold">
                آخر كارت بيزنس هتطبعه في حياتك
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white" style={{ textWrap: 'balance' }}>
                اترك انطباعاً لا يُنسى في كل اجتماع واحفظ رقمك على موبايل عميلك{' '}
                <span className="text-[#C8FF2E]">بلمسة واحدة</span>
              </h1>
              <p className="text-base text-neutral-300 leading-relaxed">
                88% من الكروت الورقية تُرمى خلال أسبوع. مع كارت <strong className="text-white">KUWI الذكي للأفراد</strong>، مجرد ما تلمس موبايل عميلك تظهر صفحتك المهنية الفخمة بكل أرقامك وحساباتك ويحفظ رقمك في جهات اتصاله خلال ثانيتين — بدون أي تطبيق.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={WHATSAPP_INDIVIDUAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[52px] px-7 py-3.5 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-base rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <WhatsAppIcon size={19} />
                  <span>اطلب كارتك الشخصي (300 ج.م فقط)</span>
                </a>
                <Link
                  href="/auth/login?mode=signup"
                  className="min-h-[52px] px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm rounded-2xl inline-flex items-center justify-center gap-2 transition"
                >
                  <span>صمّم بطاقتك الرقمية الآن مجاناً</span>
                  <ArrowUpLeftIcon size={16} />
                </Link>
              </div>
            </div>

            {/* Live Executive Card Preview */}
            <div className="lg:col-span-5 bg-[#15151F] border border-[#7C3AED]/40 rounded-3xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="px-2.5 py-1 rounded-full bg-[#7C3AED]/20 text-[#C8FF2E] font-semibold">
                  مثال حي لبطاقة عميل
                </span>
                <Link href="/c/ahmed-wasim" target="_blank" className="text-[#C8FF2E] underline">
                  افتح البطاقة الحقيقية ↗
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

        {/* Hormozi Value Stack */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/10 bg-[#12121A]">
          <div className="max-w-4xl mx-auto bg-[#181824] border border-white/10 rounded-3xl p-6 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
              ماذا تحصل مقابل <span className="text-[#C8FF2E]">300 ج.م لمرة واحدة؟</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {stack.map((line) => (
                <div key={line} className="p-4 rounded-2xl bg-[#0F0F17] border border-white/10 flex items-start gap-2.5 text-xs sm:text-sm text-neutral-200">
                  <CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/40">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-200">
                <ShieldIcon size={18} className="text-[#C8FF2E] shrink-0" />
                <span>ضمان استرجاع 365 يوماً كاملاً — تجربتك بدون أي مخاطرة</span>
              </div>
              <a
                href={WHATSAPP_INDIVIDUAL}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-6 py-3 bg-[#C8FF2E] hover:brightness-95 text-[#0B0B0F] font-bold text-sm rounded-xl inline-flex items-center gap-2 shrink-0"
              >
                <WhatsAppIcon size={17} />
                <span>اطلب كارتك الآن</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
