// Centralized KUWI Sales & Support contact config.
// Set NEXT_PUBLIC_KUWI_WHATSAPP in .env.local / Vercel (digits only with country code, e.g. 201XXXXXXXXX).
// Never hardcode an unverified phone number!

export const KUWI_FOUNDER_EMAIL = 'abdallahelzamly200393@gmail.com';

export function getKuwiWhatsAppDigits(): string {
  const raw = process.env.NEXT_PUBLIC_KUWI_WHATSAPP || '';
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
