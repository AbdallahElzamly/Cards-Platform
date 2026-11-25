import 'server-only';
import crypto from 'crypto';

const PEPPER = process.env.LOYALTY_PEPPER;

if (!PEPPER && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: LOYALTY_PEPPER environment variable is missing.');
}

const activePepper = PEPPER || 'development_fallback_pepper_32_bytes_min_length!!';

/**
 * Converts Arabic-Indic numerals (٠-٩) to Western digits (0-9).
 */
function convertArabicIndicNumerals(str: string): string {
  const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (d) => arabicIndic.indexOf(d).toString());
}

/**
 * Normalizes an Egyptian phone number to canonical E.164 format (+201xxxxxxxxx).
 * Accepts: 010/011/012/015, 201..., +201... (with Arabic-Indic digits or Western digits, spaces, dashes).
 */
export function normalizeEgyptianPhone(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  // 1. Convert Arabic-Indic numerals
  let cleaned = convertArabicIndicNumerals(raw);

  // 2. Strip non-digit characters except leading '+'
  const hasPlus = cleaned.trim().startsWith('+');
  cleaned = cleaned.replace(/\D/g, '');

  if (!cleaned) return null;

  // 3. Normalize formats
  // Local format: 01012345678 (11 digits starting with 01)
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    if (/^01[0125]\d{8}$/.test(cleaned)) {
      return `+20${cleaned.substring(1)}`;
    }
  }

  // Country code format without plus: 201012345678 (12 digits starting with 201)
  if (cleaned.length === 12 && cleaned.startsWith('201')) {
    if (/^201[0125]\d{8}$/.test(cleaned)) {
      return `+${cleaned}`;
    }
  }

  // With plus (already stripped above, but if we check raw)
  if (hasPlus) {
    if (cleaned.length === 12 && cleaned.startsWith('201')) {
      if (/^201[0125]\d{8}$/.test(cleaned)) {
        return `+${cleaned}`;
      }
    }
  }

  return null;
}

/**
 * Computes HMAC-SHA256 hash of canonical phone number using LOYALTY_PEPPER.
 */
export function hashPhone(canonicalPhone: string): string {
  return crypto
    .createHmac('sha256', activePepper)
    .update(canonicalPhone)
    .digest('hex');
}

/**
 * Computes HMAC-SHA256 hash for daily cashier PIN with programId domain separation.
 */
export function hashDailyPin(pin: string, programId: string): string {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be exactly 4 digits');
  }
  return crypto
    .createHmac('sha256', activePepper)
    .update(`${programId}:${pin}`)
    .digest('hex');
}

/**
 * Verifies 4-digit PIN against stored hash securely using timingSafeEqual.
 */
export function verifyDailyPin(pin: string, programId: string, storedHash: string): boolean {
  if (!pin || !/^\d{4}$/.test(pin) || !storedHash) return false;

  try {
    const candidateHash = hashDailyPin(pin, programId);
    const bufA = Buffer.from(candidateHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');

    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Signs a loyalty member session payload into a secure cookie token.
 */
export function signLoyaltySession(payload: { memberId: string; programId: string }): string {
  const data = {
    m: payload.memberId,
    p: payload.programId,
    iat: Date.now(),
  };

  const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', activePepper)
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
    const [encodedData, signature] = token.split('.');
    if (!encodedData || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', activePepper)
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
