# Plan: Server Actions for Loyalty MVP (`app/actions/loyalty.ts`)

## Overview
Implement secure server actions in `app/actions/loyalty.ts` (`'use server'`) handling customer registration, phone normalization, PIN rate limiting, daily PIN verification, server-side cooldown enforcement, visit logging, voucher issuance, cookie session management, and atomic voucher redemption via Supabase RPC.

## File Plan
- **`app/actions/loyalty.ts`** (new):
  - `lookupOrRegisterAndStamp(slug, firstName, phone, pin, tableCode, consentAccepted)`:
    - Normalizes phone via `normalizeEgyptianPhone`.
    - Checks 15-minute rate limit on `loyalty_pin_attempts` (max 5 fails).
    - Verifies 4-digit PIN via `verifyDailyPin` (records attempt on failure).
    - Looks up or upserts member (`program_id`, `phone_hash`).
    - Enforces `cooldown_hours` check against database `now()`.
    - If in cooldown: sets session cookie, returns status `'cooldown'` with remaining time.
    - If eligible: increments stamps/visits, logs to `loyalty_visits`, issues voucher if `current_stamps >= stamps_required`.
    - Sets `HttpOnly` signed session cookie.
  - `getMemberCardState(slug)`:
    - Reads and verifies signed session cookie (`verifyLoyaltySession`).
    - Fetches program, member state, and active voucher.
    - Computes cooldown remaining time.
  - `redeemVoucherAction(slug, voucherId, pin, tableCode)`:
    - Checks PIN rate limit and verifies daily PIN.
    - Invokes `redeem_loyalty_voucher` RPC function for atomic redemption.
  - `switchAccountAction(slug)`:
    - Clears loyalty session cookie.

## Security & Anti-Fraud Guardrails
- Server-side execution only (`'use server'`).
- Zero leakage of `daily_pin_hash`, `daily_pin_display`, or raw phone numbers.
- Constant-time PIN verification using `crypto.timingSafeEqual`.
- Rate-limiting (5 attempts per 15 minutes) stored in `loyalty_pin_attempts`.
- Atomic voucher redemption via PostgreSQL transaction / RPC.

## Verification & QA
- Test invalid PIN handling and 15-minute rate limiting.
- Test cooldown window enforcement.
- Test 6th visit voucher issuance and atomic redemption.
- Run `npm run build` and `tsc --noEmit`.
