# RULES.md — Antigravity Workspace Guardrails (`cards-platform` Loyalty MVP)

You are acting as a Senior Full-Stack Engineer and Security Reviewer extending an existing Next.js (App Router, TypeScript, Tailwind CSS) + Supabase (PostgreSQL) platform (`cards-platform`) with a zero-cost, mobile-first Restaurant NFC/QR Loyalty module.

Follow EVERY rule below strictly. If any instruction conflicts with a shortcut, these rules win.

---

## 1. Platform Protection & Scope Discipline
1. **Zero Destructive Changes to Existing Features:** NEVER drop, rename, or alter existing columns/tables used by Smart Business Cards or Google Review Cards (`cards`, `scans`, etc.) unless explicitly listed in the current task's File Allowlist.
2. **Strict Separation from Google Reviews (Policy Compliance):** NEVER link loyalty stamps, rewards, or popups to leaving a Google Review. Zero review gating. Loyalty and Google Reviews are completely separate modules.
3. **MVP-Only Execution (`P20`–`P27`):** Implement ONLY the current task requested by the user. Do NOT build V2 features (`P28` Scratch Card, `P29` VIP Tiers/PWA prompt, `P30` Absentee WhatsApp Radar, `P31` Double-Stamp Day) unless explicitly instructed. Keep database columns/toggles ready for V2 without adding V2 UI clutter.
4. **Zero-Cost Hosting Constraint (0 EGP/month):**
   - NO paid SMS OTP services.
   - NO paid third-party SaaS or heavy icon/animation libraries.
   - NO binary images stored inside PostgreSQL (`bytea`/Base64). Store optimized WebP URLs only (`< 30KB`).
   - Keep the customer-facing loyalty route (`/l/[slug]`) lightweight (`< 90KB` JS payload) for weak indoor mobile connections.

---

## 2. Security, Privacy & Anti-Fraud Hard Rules
1. **Server-Side Authority Only:** All visit validation, cooldown checks, PIN verification, rate limiting, stamp increments, and voucher redemptions MUST run inside Next.js Server Actions or Route Handlers using a server-only Supabase admin client (`SUPABASE_SERVICE_ROLE_KEY`).
2. **Zero Secret Leakage:** NEVER expose `SUPABASE_SERVICE_ROLE_KEY`, `LOYALTY_PEPPER`, `daily_pin`, or `daily_pin_hash` to Client Components, browser network payloads, HTML source, or `NEXT_PUBLIC_*` environment variables.
3. **Phone Number Privacy (Egyptian Law No. 151/2020 Compliance):**
   - Normalize all Egyptian phone inputs (supporting Western digits `0-9` and Arabic-Indic digits `٠-٩`) to canonical E.164 format (`+201xxxxxxxxx`).
   - Hash the normalized phone number server-side using `HMAC-SHA256(normalizedPhone, LOYALTY_PEPPER)`.
   - Store `phone_hash` + `phone_last4` + `first_name` + `consent_accepted_at`. Never return raw phone numbers in public API responses.
4. **Session Persistence (Defeating Safari ITP):**
   - NEVER use `localStorage` as the source of truth for stamps or identity (Safari wipes it after 7 days of inactivity).
   - Issue an `HttpOnly`, `SameSite=Lax`, `Secure` (when `NODE_ENV === 'production'`), 365-day **HMAC-signed Cookie** per program so returning customers authenticate automatically in `< 4 seconds`.
5. **Triple Anti-Fraud Shield:**
   - **Cooldown:** Enforce an 18-hour minimum gap (configurable via `cooldown_hours`) between stamps using database/server `NOW()` — NEVER trust client timestamps.
   - **Cashier Daily PIN:** Every stamp requires a valid 4-digit daily PIN verified server-side via `crypto.timingSafeEqual`. Enforce rate limiting: max **5 failed PIN attempts per 15 minutes** per IP/member.
   - **Screenshot-Proof 6th-Visit Voucher:** The free-meal voucher MUST render a live ticking seconds clock (`HH:MM:SS`) and require cashier PIN confirmation to burn the voucher atomically (`status = 'redeemed'`, preventing double-spend race conditions).
6. **Row-Level Security (RLS):** Enable RLS on EVERY new `loyalty_*` table. Block direct anonymous (`anon`) reads/writes to member/visit/voucher tables; scope merchant dashboard access strictly to authenticated owners (`auth.uid()`).

---

## 3. Routing, Caching & Localization Rules
1. **Dynamic QR/NFC Redirects (`/q/[code]`):** Always use HTTP `302` or `307` temporary redirect with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`. NEVER use `301 Permanent Redirect`.
2. **Arabic RTL Mobile-First UI:**
   - Primary viewport target: `360px`–`430px` mobile screens.
   - Entire customer & merchant loyalty UI MUST use `dir="rtl"` and Arabic copy in Cairo font (or existing platform Arabic font).
   - **CRITICAL RTL Exception:** All numeric input fields (Egyptian phone input and the 4-digit Cashier PIN boxes) MUST enforce `dir="ltr"` and `inputMode="numeric"` so digits enter naturally from left to right.
3. **Graceful Error Handling:** Never display raw Supabase errors, HTTP codes, or stack traces to restaurant customers. Always map errors to friendly Egyptian Arabic messages or render the fallback screen (`S10`).

---

## 4. Antigravity Execution Protocol (Mandatory Workflow)
1. **Plan Before Coding:** Before creating or modifying any file, output a concise plan listing the exact files you will touch and confirm they match the task's File Allowlist.
2. **Strict File Allowlist:** Only modify the files explicitly listed in the current task. If an additional file genuinely needs edits, pause and ask the user first.
3. **Atomic Diff & Verification:** After completing a task, summarize the exact diff, run type-checking (`npm run build` or `tsc --noEmit`), and list clear manual verification steps before moving to the next task.