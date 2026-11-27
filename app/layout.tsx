import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KUWI | منصة كروت الأعمال الذكية وأسطول الشركات ونظام الولاء',
  description:
    'شارك هويتك الرقمية بلمسة NFC واحدة، وأدر كروت موظفي شركتك والعملاء المحتملين، أو شغّل نظام ولاء مطعمك بدون تطبيقات.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col bg-[#FAFAFA] text-neutral-950 selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
