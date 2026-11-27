import type { Metadata } from 'next';
import Link from 'next/link';
import NfcTapGuide from '@/components/marketing/NfcTapGuide';
import { ArrowUpLeftIcon } from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'إزاي تستخدم كارت KUWI الذكي؟ دليل تقريب الكارت للآيفون والأندرويد',
  description:
    'الكارت بيتقرّب فين على الآيفون والأندرويد؟ دليل مصوّر بسيط، ونصائح لو الكارت ما اشتغلش، والبديل المضمون برمز QR.',
};

export default function TapGuidePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans antialiased" dir="rtl">
      <header className="px-4 pt-4">
        <nav className="max-w-5xl mx-auto bg-[#14141B]/90 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#C8FF2E] text-[#0B0B0F] font-bold text-sm flex items-center justify-center">
              K
            </span>
            <span className="text-sm font-semibold text-white">KUWI</span>
          </Link>
          <Link
            href="/"
            className="min-h-[40px] px-4 py-2 bg-[#181824] border border-white/10 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
          >
            <span>الصفحة الرئيسية</span>
            <ArrowUpLeftIcon size={14} />
          </Link>
        </nav>
      </header>
      <main>
        <NfcTapGuide heading="إزاي تقرّب كارت KUWI من الموبايل؟" />
      </main>
    </div>
  );
}
