import 'server-only';
import crypto from 'crypto';

function getActivePepper(): string {
  const pepper = (process.env.LOYALTY_PEPPER || '').trim();
  if (!pepper) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MISSING_LOYALTY_PEPPER');
    }
    return 'development_fallback_pepper_32_bytes_min_length!!';
  }
  return pepper;
}

/**
 * Converts Arabic-Indic numerals (٠-٩) and Eastern Arabic numerals (۰-۹) to ASCII digits (0-9).
 */
function convertToWesternNumerals(str: string): string {
  const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const easternArabic = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  return str
    .replace(/[٠-٩]/g, (d) => arabicIndic.indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => easternArabic.indexOf(d).toString());
}

/**
 * Normalizes an Egyptian mobile phone number to canonical E.164 format (+201xxxxxxxxx).
 * Accepts: 010/011/012/015, 201..., +201..., 00201... (with Arabic-Indic or ASCII digits).
 */
export function normalizeEgyptianPhone(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let cleaned = convertToWesternNumerals(raw).trim();
  cleaned = cleaned.replace(/\D/g, '');

  if (!cleaned) return null;

  // Handle 0020 international prefix -> 20
  if (cleaned.length === 14 && cleaned.startsWith('00201')) {
    cleaned = cleaned.slice(2);
  }

  // Local format: 01012345678 (11 digits)
  if (cleaned.length === 11 && /^01[0125]\d{8}$/.test(cleaned)) {
    return `+20${cleaned.slice(1)}`;
  }

  // International digits without '+': 201012345678 (12 digits)
  if (cleaned.length === 12 && /^201[0125]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Missing leading zero typed hastily: 1012345678 (10 digits)
  if (cleaned.length === 10 && /^1[0125]\d{8}$/.test(cleaned)) {
    return `+20${cleaned}`;
  }

  return null;
}

/**
 * Normalizes a 4-digit PIN (converting Arabic numerals if typed on Arabic keyboard).
 */
export function normalizePinDigits(rawPin: string): string | null {
  if (!rawPin || typeof rawPin !== 'string') return null;
  const cleaned = convertToWesternNumerals(rawPin).replace(/\D/g, '');
  if (!/^\d{4}$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Computes HMAC-SHA256 hash of canonical phone number using LOYALTY_PEPPER.
 */
export function hashPhone(canonicalPhone: string): string {
  return crypto
    .createHmac('sha256', getActivePepper())
    .update(canonicalPhone)
    .digest('hex');
}

/**
 * Hashes client IP address for privacy-compliant audit & rate limiting (never store raw IP).
 */
export function hashIpAddress(rawIp: string | null | undefined): string {
  const normalized = (rawIp || 'unknown').trim().split(',')[0].trim() || 'unknown';
  return crypto
    .createHmac('sha256', getActivePepper())
    .update(`ip:${normalized}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Computes HMAC-SHA256 hash for daily cashier PIN with programId domain separation.
 */
export function hashDailyPin(pin: string, programId: string): string {
  const normalized = normalizePinDigits(pin);
  if (!normalized) {
    throw new Error('PIN must be exactly 4 digits');
  }
  return crypto
    .createHmac('sha256', getActivePepper())
    .update(`${programId}:${normalized}`)
    .digest('hex');
}

/**
 * Verifies 4-digit PIN against stored hash securely using timingSafeEqual.
 */
export function verifyDailyPin(pin: string, programId: string, storedHash: string): boolean {
  const normalized = normalizePinDigits(pin);
  if (!normalized || !storedHash) return false;

  try {
    const candidateHash = hashDailyPin(normalized, programId);
    const bufA = Buffer.from(candidateHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');

    if (bufA.length !== bufB.length || bufA.length === 0) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Signs a loyalty member session payload into a tamper-proof HMAC cookie token.
 */
export function signLoyaltySession(payload: { memberId: string; programId: string }): string {
  const data = {
    m: payload.memberId,
    p: payload.programId,
    iat: Date.now(),
  };

  const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getActivePepper())
    .update(encodedData)
    .digest('base64url');

  return `${encodedData}.${signature}`;
}

/**
 * Verifies an HMAC-signed loyalty session token and returns the payload if valid.
 */
export function verifyLoyaltySession(token: string): { memberId: string; programId: string } | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedData, signature] = parts;
    if (!encodedData || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', getActivePepper())
      .update(encodedData)
      .digest('base64url');

    const bufA = Buffer.from(signature);
    const bufB = Buffer.from(expectedSignature);

    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed.m !== 'string' || typeof parsed.p !== 'string') {
      return null;
    }

    return {
      memberId: parsed.m,
      programId: parsed.p,
    };
  } catch {
    return null;
  }
}

/**
 * Generates a cryptographically secure 4-digit random PIN.
 */
export function generateRandomPin(): string {
  return crypto.randomInt(1000, 10000).toString();
}

/**
 * Generates a readable voucher code (e.g., FREE-8492).
 */
export function generateVoucherCode(): string {
  const randomNum = crypto.randomInt(1000, 10000);
  return `FREE-${randomNum}`;
}
