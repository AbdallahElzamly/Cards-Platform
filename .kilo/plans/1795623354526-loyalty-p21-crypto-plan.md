# Plan: Task P21 — Server Crypto, Phone Normalization & Signed Cookie Core

## Overview
Implement Task P21 of the Loyalty MVP execution plan, building `lib/loyalty-crypto.ts` and `lib/supabase-admin.ts` using strictly Node.js built-in `crypto` module (zero external npm packages) and server-only security practices.

## File Plan
- **`lib/loyalty-crypto.ts`** (new):
  - `import 'server-only'`
  - Validate `process.env.LOYALTY_PEPPER` at runtime (fail loudly if missing).
  - `normalizeEgyptianPhone(raw: string): string | null`: Converts Arabic-Indic numerals (`٠-٩`), strips formatting, matches `01[0125]\d{8}`, `201[0125]\d{8}`, `+201[0125]\d{8}`, and returns canonical `+201xxxxxxxxx`.
  - `hashPhone(normalizedPhone: string): string`: Computes HMAC-SHA256 hex digest using `LOYALTY_PEPPER`.
  - `hashDailyPin(pin: string, programId: string): string`: HMAC-SHA256 hash using `LOYALTY_PEPPER` and `programId` as domain separator.
  - `verifyDailyPin(pin: string, programId: string, storedHash: string): boolean`: Uses `crypto.timingSafeEqual` to prevent timing attacks.
  - `signLoyaltySession(payload: { memberId: string; programId: string }): string`: Creates an HMAC-signed cookie string.
  - `verifyLoyaltySession(token: string): { memberId: string; programId: string } | null`: Verifies signature and expiration.
  - `generateRandomPin(): string`: Cryptographically secure 4-digit PIN via `crypto.randomInt(1000, 10000)`.
  - `generateVoucherCode(): string`: Generates readable voucher code (`FREE-XXXX`).
- **`lib/supabase-admin.ts`** (new):
  - Initializes Supabase admin client using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with `auth: { persistSession: false }`.

## Proposed Diff Outline (for Implementation Agent)
- Create `lib/loyalty-crypto.ts` with robust helper functions and unit testable exports.
- Create `lib/supabase-admin.ts` for secure server-side database operations.

## Verification & QA
- Verify phone normalization for `٠١٠٣٠١٧٤٧٢٩`, `01030174729`, `+201030174729` produces canonical `+201030174729` and identical `hashPhone`.
- Verify cookie tampering detection in `verifyLoyaltySession`.
- Run `npm run build` / `tsc --noEmit`.
