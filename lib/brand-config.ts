// Centralized KUWI Sales & Support contact config.
// Override anytime via NEXT_PUBLIC_KUWI_WHATSAPP in Vercel Environment Variables (e.g. 201XXXXXXXXX)
// with zero code changes when switching to a dedicated KUWI Business WhatsApp line.

export const KUWI_FOUNDER_EMAIL = 'abdallahelzamly200393@gmail.com';
const DEFAULT_KUWI_WHATSAPP = '201030174729';

export function getKuwiWhatsAppDigits(): string {
  const raw = process.env.NEXT_PUBLIC_KUWI_WHATSAPP || DEFAULT_KUWI_WHATSAPP;
  return raw.replace(/\D/g, '');
}

export function getKuwiOrderHref(message: string, subject = 'طلب جديد من منصة KUWI'): string {
  const digits = getKuwiWhatsAppDigits();
  if (digits.length >= 10) {
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }
  return `mailto:${KUWI_FOUNDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

export function isKuwiWhatsAppConfigured(): boolean {
  return getKuwiWhatsAppDigits().length >= 10;
}
