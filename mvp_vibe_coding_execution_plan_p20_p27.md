# MVP_TASKS.md — Step-by-Step Antigravity Execution Plan (`P20`–`P27`)

Execute **ONE task at a time** in strict sequential order. Never combine two tasks into a single prompt.

---

## Pre-Flight Checklist (Do Once Before `P20`)
1. Create an isolated Git branch:
   ```bash
   git checkout -b feat/loyalty-mvp
   ```
2. Generate a 64-character hex secret for `LOYALTY_PEPPER`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Add `LOYALTY_PEPPER` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (and later to Vercel Environment Variables). Never prefix either with `NEXT_PUBLIC_`.

## Standard Prompt Wrapper for Antigravity
For every task below, open Antigravity in **Planning Mode** and paste:
> Read `RULES.md` and `LOYALTY_SPEC.md`, then execute **ONLY Task `PXX`** from `MVP_TASKS.md`. Show me your file plan and wait for my approval (or apply cleanly strictly within the File Allowlist), then run typecheck and give me the QA checklist.

---

## Task `P20` — Database Schema & RLS Migration (`~1.5 hrs`)
- **Goal:** Create the 5 isolated `loyalty_*` tables, indexes, and strict RLS policies without touching existing platform tables.
- **File Allowlist:**
  - `supabase/migrations/20261125_loyalty_mvp.sql` (new)
  - `types/loyalty.ts` (new — TypeScript interfaces matching the 5 tables)
- **Implementation Requirements:**
  - Write idempotent SQL (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`) matching Section 2 of `LOYALTY_SPEC.md`.
  - Include a helper SQL function or atomic transaction logic for `redeem_loyalty_voucher` (or clear constraints preventing double-redemption).
  - Enable RLS on all 5 tables with exact owner-scoped merchant policies and zero `anon` read/write access.
  - Include a commented-out seed block at the bottom of the SQL file to insert one test restaurant (`slug: 'test-cafe'`, PIN `1234`, `min_bill_egp: 100`).
- **Verification / QA:**
  - Run migration in Supabase SQL Editor with zero errors.
  - Verify in Supabase Dashboard → Authentication → Policies that RLS shows **Enabled** on all 5 `loyalty_*` tables.
  - Run `git commit -m "feat(loyalty): P20 add isolated loyalty tables, types, and RLS"`.

---

## Task `P21` — Crypto, Phone Normalization & Signed Cookie Core (`~1.5 hrs`)
- **Goal:** Build pure, server-only security utilities + Supabase server admin helper.
- **File Allowlist:**
  - `lib/loyalty-crypto.ts` (new)
  - `lib/supabase-admin.ts` (new — only if not already present; check existing `lib/` first)
- **Implementation Requirements:**
  - Mark `lib/loyalty-crypto.ts` with `import 'server-only'` (or ensure it uses Node `crypto` strictly on the server).
  - Implement `normalizeEgyptianPhone` (including Arabic-Indic digit conversion `٠-٩` → `0-9`), `hashPhone`, `hashDailyPin`, `verifyDailyPin` (using `crypto.timingSafeEqual`), `signLoyaltySession`, `verifyLoyaltySession`, `generateRandomPin` (cryptographically secure 4 digits using `crypto.randomInt(1000, 10000)`), and `generateVoucherCode` (`FREE-XXXX`).
  - Fail loudly on server startup/call if `LOYALTY_PEPPER` is missing.
- **Verification / QA:**
  - Run a quick Node/TS check verifying:
    - `٠١٠٣٠١٧٤٧٢٩` and `01030174729` and `+201030174729` produce the exact same `phone_hash`.
    - Tampering 1 character in the signed cookie causes `verifyLoyaltySession` to return `null`.
  - Run `git commit -m "feat(loyalty): P21 add server crypto, phone normalizer, and signed cookies"`.

---

## Task `P22` — Dynamic QR/NFC Gateway Hook & Route Skeleton (`~1.5 hrs`)
- **Goal:** Wire `/q/[code]` to support loyalty destinations with zero caching, create `/l/[slug]` server route skeleton, and build `S10` fallback screen.
- **File Allowlist:**
  - Existing `/q/[code]` route file (minimal non-breaking edit ONLY — inspect first!)
  - `app/l/[slug]/page.tsx` (new)
  - `app/l/[slug]/error.tsx` (new — `S10` Fallback)
  - `app/l/[slug]/not-found.tsx` (new — `S10` Fallback)
- **Implementation Requirements:**
  - In `/q/[code]`, ensure redirects use `302` or `307` and explicitly set `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` while preserving 100% compatibility with existing Smart Business Cards and Google Review Cards.
  - In `app/l/[slug]/page.tsx`, set `export const dynamic = 'force-dynamic'`. Fetch ONLY safe public fields from `loyalty_programs` (NEVER select `daily_pin_hash` or `daily_pin_display`). If missing or `is_active === false`, trigger `notFound()`.
  - Read the signed cookie if present, load the member's current state + active voucher (if any), and calculate server-side cooldown remaining time.
- **Verification / QA:**
  - Inspect response headers of `/q/[code]` in DevTools Network tab: confirm `302`/`307` and `Cache-Control: no-store`.
  - Visit `/l/non-existent-slug`: confirm clean Arabic `S10` screen with zero stack traces.
  - Run `git commit -m "feat(loyalty): P22 wire non-cached gateway and /l/[slug] server entry"`.

---

## Task `P23` — Server Actions: Registration, Stamping, Cooldown & Rate Limiting (`~2.5 hrs`)
- **Goal:** Implement all customer-side business logic securely on the server.
- **File Allowlist:**
  - `app/l/[slug]/actions.ts` (new)
- **Implementation Requirements:**
  - **`registerOrLookupAndStampAction(formData)`:**
    1. Validate first name, consent checkbox, and `normalizeEgyptianPhone`.
    2. Check PIN rate limit (`loyalty_pin_attempts` — max 5 fails in 15 min).
    3. Verify 4-digit Cashier PIN via `verifyDailyPin`. On failure, log attempt and return friendly Arabic error.
    4. Upsert/lookup member by `(program_id, phone_hash)`.
    5. Enforce server-side `cooldown_hours` using DB `now()` against `last_visit_at`. If inside cooldown, set signed cookie anyway (so they see `S05` with their existing card) and return `{ status: 'cooldown', remainingMinutes }`.
    6. Increment `current_stamps` & `total_visits`, insert row into `loyalty_visits` (with optional sanitized `table_code`).
    7. If `current_stamps >= stamps_required`, atomically create an `'active'` row in `loyalty_vouchers`.
    8. Set `HttpOnly` signed session cookie (365 days) and `revalidatePath`.
  - **`stampReturningMemberAction(pin, tableCode)`:** Same PIN, rate-limit, cooldown, and voucher logic using member identity from the verified signed cookie (takes `< 4s` UX).
  - **`redeemVoucherAction(voucherId, pin, tableCode)`:** Verify Cashier PIN + rate limit, then execute an atomic conditional update (`WHERE id = voucherId AND status = 'active'`) to burn the voucher, reset `current_stamps = 0`, increment `total_redemptions`. Reject if already redeemed.
  - **`switchAccountAction(slug)`:** Safely delete the loyalty session cookie.
- **Verification / QA:**
  - Confirm no PIN hash or raw phone is returned in any action response.
  - Test rate limit: 5 wrong PINs trigger the 15-minute lock message.
  - Run `git commit -m "feat(loyalty): P23 add secure server actions with cooldown, rate limit, and atomic vouchers"`.

---

## Task `P24` — Mobile-First Customer UI (`S02`, `S03`, `S04`, `S05`) (`~3 hrs`)
- **Goal:** Build the ultra-fast Arabic RTL customer experience (`< 90KB` bundle).
- **File Allowlist:**
  - `components/loyalty/LoyaltyClientShell.tsx` (new)
  - `components/loyalty/RegistrationCard.tsx` (new — `S02`)
  - `components/loyalty/PinBottomSheet.tsx` (new — `S03`)
  - `components/loyalty/StampCardView.tsx` (new — `S04` & `S05`)
  - `components/loyalty/MiniConfetti.tsx` (new — lightweight CSS/canvas burst `< 4KB`, no heavy npm library)
  - `app/l/[slug]/page.tsx` (wire shell)
- **Implementation Requirements:**
  - Implement exact Arabic copy and layout from Section 5 of `LOYALTY_SPEC.md`.
  - Enforce `dir="rtl"` globally on the loyalty wrapper, and `dir="ltr"` + `inputMode="numeric"` on the phone input and 4 PIN boxes.
  - `PinBottomSheet` MUST auto-submit when the 4th digit is typed, show a clean loading spinner, and shake gently on wrong PIN.
  - Trigger golden Goal-Gradient styling on stamps 4 and 5 (`«خطوة واحدة وتاكل على حسابنا! 🔥»`).
  - Render `S05` (positive green cooldown banner + remaining hours/minutes) when within cooldown while keeping the stamp grid visible.
- **Verification / QA:**
  - Use Antigravity Browser at `360px` width to inspect `/l/test-cafe`:
    - Verify zero horizontal overflow.
    - Verify PIN boxes fill left-to-right (`1 → 2 → 3 → 4`).
    - Verify Visit 1 flow completes in `< 12s`, reload page, confirm cookie remembers user automatically without asking for phone again.
  - Run `git commit -m "feat(loyalty): P24 build mobile-first RTL customer UI (S02-S05)"`.

---

## Task `P25` — Golden 6th-Visit Voucher (`S07`) & Cashier Redemption Flow (`~2 hrs`)
- **Goal:** Build the screenshot-proof 6th-visit Golden Voucher with live seconds clock and cashier-only burn flow.
- **File Allowlist:**
  - `components/loyalty/GoldenVoucherCard.tsx` (new — `S07`)
  - `components/loyalty/LoyaltyClientShell.tsx` (render `S07` when an active voucher exists)
- **Implementation Requirements:**
  - Gold gradient card with lightweight CSS shimmer (`@keyframes`).
  - Live ticking clock updated every `1000ms` (`HH:MM:SS` + formatted Arabic date) + pulsing green live indicator (`«قسيمة حية ومباشرة»`).
  - Display `voucher_code`, `reward_title`, and `reward_terms` clearly.
  - Cashier-only warning + button `«تأكيد تسليم الوجبة المجانية (للكاشير)»` → opens `PinBottomSheet` in `redeem` mode → calls `redeemVoucherAction`.
  - Show immediate success celebration (`«تم تسليم الهدية بنجاح ✅ — بدأت دورتك الجديدة!»`) and reset UI cleanly to `0/6` stamps.
- **Verification / QA:**
  - Test full 6-visit cycle (temporarily set `cooldown_hours = 0` or adjust `last_visit_at` in Supabase for test user), confirm voucher issues on visit 6, confirm live seconds tick, redeem with Cashier PIN, and confirm reloading page shows `0/6` (voucher cannot be reused).
  - Run `git commit -m "feat(loyalty): P25 add screenshot-proof golden voucher and atomic redemption"`.

---

## Task `P26` — Merchant & Cashier Control Panel (`S09`) (`~2.5 hrs`)
- **Goal:** Build the mobile-friendly restaurant owner/cashier dashboard inside `/dashboard`.
- **File Allowlist:**
  - `app/dashboard/loyalty/[businessId]/page.tsx` (new)
  - `app/dashboard/loyalty/[businessId]/actions.ts` (new)
  - `components/loyalty/MerchantDashboardClient.tsx` (new)
- **Implementation Requirements:**
  - Verify authenticated Supabase session (`auth.uid()`) and confirm `owner_id === user.id` before loading or mutating any data.
  - **Hero PIN Card:** Large LTR display of `daily_pin_display` + 1-click button `«تغيير الكود الآن 🔄»` calling a Server Action that generates a fresh random 4-digit PIN, updates `daily_pin_hash`, `daily_pin_display`, and `pin_rotated_at`.
  - **4 Live KPI Cards:** Today's visits, Total members, Members at 4–5 stamps (near reward), Total redeemed free meals.
  - **Quick Program Settings Form:** Update `min_bill_egp`, `reward_title`, `reward_terms`, `cooldown_hours`, `stamps_required`, `is_active`.
  - **Recent Activity List:** Last 20 visits/redemptions showing `first_name`, `****${phone_last4}`, stamp badge, table code, and relative Arabic time.
- **Verification / QA:**
  - Verify unauthenticated visit to `/dashboard/loyalty/[businessId]` redirects to login.
  - Click `«تغيير الكود الآن 🔄»`, verify old PIN immediately fails on customer screen and new PIN succeeds.
  - Run `git commit -m "feat(loyalty): P26 add authenticated merchant and cashier control panel"`.

---

## Task `P27` — Supabase Keep-Alive Cron & Final Security Audit (`~1.5 hrs`)
- **Goal:** Prevent Supabase Free 7-day auto-pause and run a full security/performance verification before client launch.
- **File Allowlist:**
  - `app/api/health/route.ts` (new)
  - `.github/workflows/supabase-keepalive.yml` (new)
- **Implementation Requirements:**
  - `app/api/health/route.ts`: Perform a tiny read query (`SELECT id FROM loyalty_programs LIMIT 1`), return `200 OK` JSON `{ status: 'ok', timestamp }` with `Cache-Control: no-store`. Never expose DB details on error.
  - `.github/workflows/supabase-keepalive.yml`: Schedule `cron: '0 8 */4 * *'` (every 4 days) + `workflow_dispatch` to `curl -fsS ${{ secrets.APP_HEALTH_URL }}`.
  - Run a full codebase audit checking:
    1. Zero `SUPABASE_SERVICE_ROLE_KEY`, `LOYALTY_PEPPER`, or `daily_pin` references in any `'use client'` file.
    2. `npm run build` succeeds with zero TypeScript/ESLint errors.
    3. Existing Smart Business Card & Google Review routes still work untouched.
- **Verification / QA:**
  - Hit `/api/health` locally and on Vercel preview — confirm `200 OK`.
  - Run the 10 manual exploit checks from Workbook Sheet 07 (tampered cookie, changing phone clock, wrong PIN 6x, screenshot check, double-redemption race check).
  - Run `git commit -m "feat(loyalty): P27 add keep-alive cron and complete MVP security audit"`.

---

## Appendix — V2 Backlog (DO NOT BUILD DURING MVP)
Keep out of scope until first paying restaurant client is live on MVP:
- **`P28`:** Optional Visit-3 Scratch Card (`v2_scratch_enabled` toggle, `< 5KB` canvas).
- **`P29`:** Post-6th-Visit VIP Tier Upgrade (`silver`/`gold`) + Add-to-Home-Screen PWA banner.
- **`P30`:** Absentee Customer Radar (`last_visit_at > 14 days`) with 1-tap WhatsApp A-C-A message links.
- **`P31`:** Merchant "Double-Stamps Day" event toggle (`v2_double_stamp_active`).