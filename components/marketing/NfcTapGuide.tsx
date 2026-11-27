import React from 'react';
import { CheckIcon, QrCodeIcon } from '@/components/ui/Icons';

interface NfcTapGuideProps {
  id?: string;
  heading?: string;
}

function PhoneIllustration({ variant }: { variant: 'iphone' | 'android' }) {
  const isIphone = variant === 'iphone';
  // Highlighted NFC zone: top of back for iPhone, middle of back for Android
  const zoneY = isIphone ? 52 : 118;
  const cardY = isIphone ? 40 : 106;

  return (
    <svg
      viewBox="0 0 200 300"
      role="img"
      aria-label={
        isIphone
          ? 'رسمة توضح تقريب الكارت من أعلى ضهر الآيفون'
          : 'رسمة توضح تقريب الكارت من منتصف ضهر الأندرويد'
      }
      className="w-full max-w-[220px] h-auto mx-auto"
    >
      {/* Phone body (back view) */}
      <rect x="40" y="10" width="120" height="280" rx="26" fill="#2A1B54" stroke="#7C3AED" strokeWidth="3" />
      {/* Camera module */}
      {isIphone ? (
        <g>
          <rect x="52" y="22" width="52" height="52" rx="14" fill="#1B1236" stroke="#A78BFA" strokeWidth="2" />
          <circle cx="68" cy="38" r="8" fill="#0B0B0F" stroke="#A78BFA" strokeWidth="2" />
          <circle cx="90" cy="38" r="8" fill="#0B0B0F" stroke="#A78BFA" strokeWidth="2" />
          <circle cx="79" cy="60" r="8" fill="#0B0B0F" stroke="#A78BFA" strokeWidth="2" />
        </g>
      ) : (
        <g>
          <rect x="94" y="22" width="52" height="22" rx="11" fill="#1B1236" stroke="#A78BFA" strokeWidth="2" />
          <circle cx="108" cy="33" r="6" fill="#0B0B0F" stroke="#A78BFA" strokeWidth="2" />
          <circle cx="130" cy="33" r="6" fill="#0B0B0F" stroke="#A78BFA" strokeWidth="2" />
        </g>
      )}
      {/* Brand mark on the phone */}
      <circle cx="100" cy={isIphone ? 190 : 214} r="10" fill="#7C3AED" opacity="0.35" />

      {/* NFC zone highlight */}
      <rect
        x="56"
        y={zoneY}
        width="88"
        height="62"
        rx="16"
        fill="#C8FF2E"
        opacity="0.18"
        stroke="#C8FF2E"
        strokeWidth="2"
        strokeDasharray="6 5"
      />

      {/* Card hovering over the zone */}
      <g transform={`rotate(-8 100 ${cardY + 30})`}>
        <rect x="62" y={cardY} width="76" height="48" rx="9" fill="#C8FF2E" stroke="#0B0B0F" strokeWidth="2" />
        <circle cx="82" cy={cardY + 20} r="9" fill="#7C3AED" />
        <text x="82" y={cardY + 24} textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">K</text>
        <rect x="98" y={cardY + 14} width="30" height="5" rx="2.5" fill="#0B0B0F" opacity="0.55" />
        <rect x="98" y={cardY + 24} width="22" height="5" rx="2.5" fill="#0B0B0F" opacity="0.35" />
      </g>
    </svg>
  );
}

const TIPS = [
  'افتح شاشة الموبايل. وفي الأندرويد اتأكد إن الـ NFC شغال من الإعدادات.',
  'ثبّت الكارت من 1 لـ 2 ثانية ومتشدوش بسرعة.',
  'الجراب السميك أو اللي فيه معدن، أو أي استيكر معدني ورا الموبايل، ممكن يمنع القراءة. شيله وجرّب.',
  'لو الكارت ما اشتغلش، حرّكه ببطء لفوق ولتحت على ضهر الموبايل. مكان الـ NFC بيختلف من موبايل للتاني.',
];

export default function NfcTapGuide({
  id = 'tap-guide',
  heading = 'الكارت بيتقرّب فين بالظبط؟',
}: NfcTapGuideProps) {
  return (
    <section id={id} className="py-16 px-4 sm:px-6 border-t border-white/10 bg-[#0B0B0F]" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#7C3AED]/25 text-[#C8FF2E] text-xs font-bold mb-3">
            دليل الاستخدام للزباين
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{heading}</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            أكتر سؤال بيجي من زباين أصحاب الكروت: «أحط الكارت فين على الموبايل؟». الرسمتين دول بيجاوبوا عليه في ثانية، وتقدر تبعتهم لزبونك أو تعرضهم عند الكاشير.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="bg-[#15151F] border border-white/10 rounded-3xl p-6 text-center">
            <PhoneIllustration variant="iphone" />
            <h3 className="text-xl font-bold text-white mt-4 mb-1">آيفون</h3>
            <p className="text-sm font-semibold text-[#C8FF2E] mb-2">ضهر الجهاز من فوق</p>
            <p className="text-xs text-neutral-300 leading-relaxed">
              قرّب الكارت من الحتة اللي فوق ورا الموبايل، جنب الكاميرا.
            </p>
          </div>

          <div className="bg-[#15151F] border border-white/10 rounded-3xl p-6 text-center">
            <PhoneIllustration variant="android" />
            <h3 className="text-xl font-bold text-white mt-4 mb-1">أندرويد</h3>
            <p className="text-sm font-semibold text-[#C8FF2E] mb-2">ضهر الجهاز من النص</p>
            <p className="text-xs text-neutral-300 leading-relaxed">
              قرّب الكارت من نص ضهر الموبايل. بعض الموبايلات بتختلف شوية في المكان.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <div className="md:col-span-3 bg-[#15151F] border border-white/10 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-4">لو الكارت ما اشتغلش من أول مرة</h3>
            <ul className="space-y-3 text-xs sm:text-sm text-neutral-200">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckIcon size={16} className="text-[#C8FF2E] shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 bg-[#181628] border border-[#C8FF2E]/60 rounded-3xl p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[#C8FF2E]">
              <QrCodeIcon size={20} />
              <h3 className="text-base font-bold">البديل المضمون: الـ QR</h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
              على ضهر كل كارت KUWI رمز QR. لو موبايل الزبون قديم أو مفيهوش NFC، يفتح الكاميرا ويصوّر الرمز وتفتح نفس الصفحة.
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              نصيحة للكاشير: قول للزبون جملة واحدة: «قرّب موبايلك من الكارت»، وأشّر له على المكان.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
