// Safe, zero-migration encoder/decoder for storing optional Restaurant Menu URL
// inside loyalty_programs.reward_terms without breaking existing DB schema.

const MENU_MARKER_REGEX = /\s*\[\[MENU_URL:(https?:\/\/[^\]]+)\]\]\s*/i;

export function parseRewardTermsAndMenu(rawRewardTerms?: string | null): {
  terms: string;
  menuUrl: string;
} {
  const input = (rawRewardTerms || '').trim();
  const match = input.match(MENU_MARKER_REGEX);
  const menuUrl = match?.[1]?.trim() || '';
  const terms = input.replace(MENU_MARKER_REGEX, '').trim();
  return { terms, menuUrl };
}

export function sanitizeMenuUrl(rawUrl?: string | null): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProto);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.toString().slice(0, 350);
  } catch {
    return '';
  }
}

export function encodeRewardTermsAndMenu(
  terms: string,
  rawMenuUrl?: string | null
): string {
  const cleanTerms = terms.replace(MENU_MARKER_REGEX, '').trim().slice(0, 200);
  const safeMenu = sanitizeMenuUrl(rawMenuUrl);
  if (!safeMenu) return cleanTerms;
  return `${cleanTerms} [[MENU_URL:${safeMenu}]]`.trim();
}
