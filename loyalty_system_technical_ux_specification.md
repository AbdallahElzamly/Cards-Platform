# LOYALTY_SPEC.md — Restaurant NFC/QR Loyalty System Blueprint

## 1. Product Goal & Experience Targets
Build an ultra-fast, zero-app-download web loyalty card for restaurants and cafes triggered by tapping a table NFC chip (`NTAG215`) or scanning a fallback Dynamic QR code (`/q/[code]` → `/l/[slug]?t=[table]`).

- **Core Business Rule:** Count verified visits; on the **6th visit** (`stamps_required`, default `6`), unlock a free meal/drink voucher subject to merchant-configured minimum bill and reward terms.
- **Speed Targets (Anti-Overwhelm Principle):**
  - **Visit 1 (New Customer):** `<= 12 seconds` total (Enter first name + mobile number + 4-digit Cashier PIN → Stamp 1/6 awarded immediately with lightweight celebration — *Endowed Progress Effect*).
  - **Visits 2–6 (Returning Customer):** `<= 4 seconds` total (Auto-recognized via signed `HttpOnly` cookie → Enter 4-digit Cashier PIN → Stamp awarded automatically).
  - **Zero App Download, Zero SMS OTP, Zero Passwords for Customers.**

---

## 2. Database Schema (Supabase PostgreSQL — Isolated `loyalty_*` Tables)

All tables live in `public` schema with `RLS ENABLED`. Never touch existing `cards` or `scans` schema definitions.

### Table 1: `loyalty_programs`
Stores per-restaurant configuration and rotating daily PIN.
- `id` `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `owner_id` `uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `slug` `text UNIQUE NOT NULL` (e.g., `dose-cafe`, lowercase kebab-case)
- `business_name` `text NOT NULL` (Arabic/English display name)
- `logo_url` `text` (Optimized WebP URL from Storage/R2, optional)
- `primary_color` `text NOT NULL DEFAULT '#1E3A8A'` (Hex accent)
- `stamps_required` `smallint NOT NULL DEFAULT 6 CHECK (stamps_required BETWEEN 3 AND 12)`
- `min_bill_egp` `integer NOT NULL DEFAULT 100` (Displayed clearly to prevent low-ticket abuse)
- `reward_title` `text NOT NULL DEFAULT 'وجبتك السادسة مجاناً'`
- `reward_terms` `text NOT NULL DEFAULT 'بحد أقصى متوسط طلباتك أو من قائمة المكافآت المختارة'`
- `cooldown_hours` `smallint NOT NULL DEFAULT 18 CHECK (cooldown_hours BETWEEN 1 AND 72)`
- `daily_pin_hash` `text NOT NULL` (HMAC/hash of current 4-digit PIN)
- `daily_pin_display` `text NOT NULL` (Encrypted or merchant-only readable 4-digit PIN — NEVER selected in public queries!)
- `pin_rotated_at` `timestamptz NOT NULL DEFAULT now()`
- `is_active` `boolean NOT NULL DEFAULT true`
- `v2_scratch_enabled` `boolean NOT NULL DEFAULT false` *(V2 toggle — unused in MVP)*
- `v2_double_stamp_active` `boolean NOT NULL DEFAULT false` *(V2 toggle — unused in MVP)*
- `created_at` `timestamptz NOT NULL DEFAULT now()`

### Table 2: `loyalty_members`
Stores privacy-safe customer profiles per restaurant.
- `id` `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `program_id` `uuid NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE`
- `first_name` `text NOT NULL` (Max 30 chars, trimmed)
- `phone_hash` `text NOT NULL` (`HMAC-SHA256` of normalized `+201xxxxxxxxx`)
- `phone_last4` `char(4) NOT NULL` (For cashier/merchant recognition only)
- `current_stamps` `smallint NOT NULL DEFAULT 0` (`0` to `stamps_required`)
- `total_visits` `integer NOT NULL DEFAULT 0`
- `total_redemptions` `integer NOT NULL DEFAULT 0`
- `tier` `text NOT NULL DEFAULT 'standard'` (`standard` | `silver` | `gold` — V2 ready)
- `last_visit_at` `timestamptz`
- `consent_accepted_at` `timestamptz NOT NULL DEFAULT now()`
- `created_at` `timestamptz NOT NULL DEFAULT now()`
- **Constraint:** `UNIQUE (program_id, phone_hash)`
- **Indexes:** `(program_id, last_visit_at DESC)`, `(program_id, current_stamps)`

### Table 3: `loyalty_visits`
Immutable audit log of every verified visit.
- `id` `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `program_id` `uuid NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE`
- `member_id` `uuid NOT NULL REFERENCES loyalty_members(id) ON DELETE CASCADE`
- `table_code` `text` (Optional query param `?t=3`, sanitized max 16 chars)
- `stamps_awarded` `smallint NOT NULL DEFAULT 1`
- `stamp_number_after` `smallint NOT NULL`
- `ip_hash` `text` (Hashed IP for abuse audit, never raw IP)
- `created_at` `timestamptz NOT NULL DEFAULT now()`
- **Index:** `(member_id, created_at DESC)`, `(program_id, created_at DESC)`

### Table 4: `loyalty_vouchers`
Tracks earned 6th-visit free-meal vouchers and atomic redemptions.
- `id` `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `program_id` `uuid NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE`
- `member_id` `uuid NOT NULL REFERENCES loyalty_members(id) ON DELETE CASCADE`
- `voucher_code` `text UNIQUE NOT NULL` (Short readable code e.g. `FREE-8492`)
- `reward_title` `text NOT NULL`
- `status` `text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired'))`
- `issued_at` `timestamptz NOT NULL DEFAULT now()`
- `redeemed_at` `timestamptz`
- `redeemed_by_table` `text`
- **Index:** `(member_id, status)`

### Table 5 (Lightweight Security): `loyalty_pin_attempts`
Server-side rate limiting without needing paid Redis.
- `id` `bigserial PRIMARY KEY`
- `program_id` `uuid NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE`
- `actor_key` `text NOT NULL` (Hashed IP + memberId/phoneHash)
- `attempted_at` `timestamptz NOT NULL DEFAULT now()`
- **Index:** `(program_id, actor_key, attempted_at DESC)`
- **Rule:** Count rows in last 15 minutes; if `>= 5`, reject with friendly lock message. Clean up old rows opportunistically or on success.

### RLS Policy Summary
- Enable RLS on all 5 tables.
- `loyalty_programs`: Authenticated `owner_id = auth.uid()` can `SELECT`/`UPDATE` their own rows. No direct `anon` access to `daily_pin_display` or `daily_pin_hash` (public customer pages fetch safe columns only via Server Component / Service Role helper).
- `loyalty_members`, `loyalty_visits`, `loyalty_vouchers`: Authenticated merchant can `SELECT` rows belonging to `program_id IN (SELECT id FROM loyalty_programs WHERE owner_id = auth.uid())`. Direct `anon` access = **DENY ALL**.
- `loyalty_pin_attempts`: Direct `anon` and `authenticated` access = **DENY ALL** (Service Role server-only).

---

## 3. Cryptography & Cookie Specification (`lib/loyalty-crypto.ts`)

1. **`normalizeEgyptianPhone(raw: string): string | null`**
   - Convert Arabic-Indic numerals (`٠١٢٣٤٥٦٧٨٩`) to ASCII (`0-9`).
   - Strip spaces, dashes, parentheses.
   - Accept `01[0125]\d{8}`, `201[0125]\d{8}`, `+201[0125]\d{8}`.
   - Return canonical `+201xxxxxxxxx` or `null` if invalid.
2. **`hashPhone(normalizedPhone: string): string`**
   - `crypto.createHmac('sha256', process.env.LOYALTY_PEPPER!).update(normalizedPhone).digest('hex')`
3. **`hashDailyPin(pin: string, programId: string): string` & `verifyDailyPin(pin, programId, storedHash)`**
   - Validate `/^\d{4}$/`.
   - Compute HMAC-SHA256 with `LOYALTY_PEPPER` and `programId` as domain separator.
   - Compare buffers using `crypto.timingSafeEqual`.
4. **`signLoyaltySession(payload: { memberId: string; programId: string })` & `verifyLoyaltySession(cookieValue: string)`**
   - Cookie name: `loyalty_sess_${programSlug}` (or scoped path `/l/${programSlug}`).
   - Format: `base64url(JSON.stringify({ m: memberId, p: programId, iat })) + '.' + hmacSha256Signature`.
   - Attributes: `httpOnly: true`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`, `maxAge: 60 * 60 * 24 * 365`, `path: '/'`.

---

## 4. Route Map

| Route | Purpose | Caching / Auth |
| :--- | :--- | :--- |
| `/q/[code]` | Existing Dynamic QR/NFC gateway — forwards loyalty codes to `/l/[slug]?t=[table]` | HTTP `302`/`307`, `Cache-Control: no-store` |
| `/l/[slug]` | Customer-facing mobile web app (`S02`–`S05`, `S07`, `S10`) | `export const dynamic = 'force-dynamic'` |
| `/dashboard/loyalty/[businessId]` | Merchant & Cashier Control Panel (`S09`) | Authenticated owner only (`auth.uid()`) |
| `/api/health` | Lightweight DB ping for GitHub Actions Keep-Alive Cron | `SELECT 1` on `loyalty_programs` (limit 1), returns `{ ok: true, ts }` |

---

## 5. Screen-by-Screen UX Specification (`S01`–`S10`)

Design System: High-contrast clean cards, Arabic `Cairo` font, `dir="rtl"`, mobile max-width `430px` centered, rounded corners (`rounded-2xl`), thumb-friendly tap targets (`min-h-[48px]`).

### `S01` — Entry Gateway (`/q/[code]` → `/l/[slug]?t=3`)
- Instant server redirect (`< 1s`), no splash screen, no login wall.
- Reads signed cookie on `/l/[slug]`:
  - If valid cookie found → load member state directly (`S04`, `S05`, or `S07`).
  - If no cookie → render `S02` (Fast Registration / Lookup).

### `S02` — Fast First-Visit Registration & Phone Lookup (`<= 12s`)
- **Top:** Restaurant logo + name + welcoming badge: `«اجمع 5 زيارات.. والسادسة علينا مجاناً!»`
- **Visual Preview:** Compact row of 6 empty stamp circles (Stamp 6 highlighted with a gift icon).
- **Form (Only 2 fields):**
  1. `اسمك الأول` (text, optional if returning user just enters phone to recover account)
  2. `رقم موبايلك` (`dir="ltr"`, `inputMode="numeric"`, placeholder `01xxxxxxxxx`, helper: `«عشان نحفظلك أختامك حتى لو غيرت الموبايل»`)
- **Consent Notice (Egypt Law 151/2020):** Compact checkbox (checked-friendly clear label): `«أوافق على حفظ رقمي مشفّراً لتسجيل زياراتي في برنامج الولاء فقط»`
- **Primary CTA:** `«ابدأ واختم زيارتك الأولى»`
- **Smart Behavior:** If `phone_hash` already exists for this program, log the customer right back into their existing stamps (never create duplicate accounts, never reset their progress!).
- **Footer Micro-text:** Clear minimum bill note: `«تُحتسب الزيارة عند حد أدنى للفاتورة {min_bill_egp} ج.م»`.

### `S03` — Cashier PIN Verification Bottom Sheet (`<= 4s`)
- Triggered immediately after `S02` submit OR via the big primary button `«اختم زيارتي اليوم»` on `S04` for returning users.
- **Title:** `«أدخل كود الكاشير اليومي (4 أرقام)»`
- **Subtitle:** `«اسأل الكاشير أو شوف الكود المطبوع على الكاونتر»`
- **Input:** 4 crisp OTP-style numeric boxes wrapped in `dir="ltr"` with `inputMode="numeric"`, auto-focus, auto-advance, backspace support, and **auto-submit immediately when the 4th digit is typed** (no extra button tap needed).
- **Error States (Friendly Arabic):**
  - Wrong PIN: `«الكود غير صحيح، راجع الكاشير وجرب تاني»` + gentle shake animation.
  - Rate limited (5 fails / 15m): `«محاولات كتير غلط، استنى 15 دقيقة وجرب تاني»`.

### `S04` — Interactive Stamp Card (Visits 1–5)
- **Header:** `«منور يا {first_name} 👋»` + subtitle `«زيارتك رقم {current_stamps} من {stamps_required}»`
- **Stamp Grid:** 6 large circular badges (3x2 grid on mobile):
  - Filled stamps: vibrant checkmark + subtle stamp-in animation.
  - Stamp 6: golden gift icon (`🎁 مجاناً`).
- **Progress Bar & Goal-Gradient Psychology:**
  - Stamps 1–3: Brand primary color.
  - Stamps 4–5: Transitions to glowing gold gradient + motivating banner: `«خطوة واحدة وتاكل على حسابنا! 🔥»` (at 5/6) or `«قربت جداً! فاضلك زيارتين بس»` (at 4/6).
- **Celebration:** Lightweight CSS/canvas confetti burst (`< 4KB`) when a new stamp is freshly awarded.
- **Primary CTA:**
  - If eligible now (outside 18h cooldown and no active voucher): Big button `«اختم زيارتي اليوم»` (opens `S03`).
- **Footer:** `«آخر زيارة: {formatted_date}»` + small link `«تبديل الرقم / مش أنا؟»` (clears cookie safely) + terms summary.

### `S05` — Friendly Cooldown State (Within 18 Hours)
- Shown instead of an ugly error when a customer taps the chip again within `cooldown_hours`.
- **Card UI (Positive Green/Teal Tone):**
  - Icon: `✅`
  - Headline: `«زيارتك النهارده اتسجلت بالفعل!»`
  - Body: `«استمتع بوجبتك، تقدر تختم زيارتك الجاية بعد {remaining_hours} ساعة و{remaining_minutes} دقيقة»`
  - Still displays their current 6-stamp card below so they can admire their progress!

### `S06` — Scratch Card at Visit 3 `[V2 — DO NOT BUILD IN MVP]`
- Deferred to `P28`. Only the boolean `v2_scratch_enabled` exists in DB.

### `S07` — Golden 6th-Visit Free Meal Voucher (Anti-Screenshot Shield)
- Automatically shown when customer hits stamp `6/6` (or has an `status = 'active'` voucher).
- **Visual Design:** Premium gold-gradient card with subtle CSS shimmer animation.
- **Live Anti-Screenshot Clock:** Prominent ticking digital clock updating every second (`HH:MM:SS` + today's date) with pulsing green dot `«قسيمة حية ومباشرة»` so a static screenshot is immediately obvious to the cashier.
- **Voucher Details:**
  - `«مبروك يا {first_name}! 🎉»`
  - Reward title: `{reward_title}`
  - Unique code: `{voucher_code}`
  - Clear terms: `{reward_terms}`
- **Cashier-Only Redemption Flow:**
  - Warning label: `«للكاشير فقط — لا تضغط إلا أمام الكاشير»`
  - Button: `«تأكيد تسليم الوجبة المجانية (للكاشير)»`
  - Clicking opens the 4-digit Cashier PIN sheet (`S03` in `redeem` mode).
  - On valid PIN: Server atomically sets voucher `status = 'redeemed'`, resets `current_stamps = 0`, increments `total_redemptions`, and displays confirmation: `«تم تسليم الهدية بنجاح ✅ — بدأت دورتك الجديدة!»`.

### `S08` — VIP Tier Upgrade & PWA Prompt `[V2 — DO NOT BUILD IN MVP]`
- Deferred to `P29`.

### `S09` — Merchant & Cashier Dashboard (`/dashboard/loyalty/[businessId]`)
- Mobile-optimized so the restaurant owner/cashier can run everything from a phone.
- **Hero Card — Today's Cashier PIN:**
  - Huge bold LTR digits (`font-mono text-5xl tracking-widest`), e.g. `4 8 2 9`.
  - One-tap button: `«تغيير الكود الآن 🔄»` (instantly generates a new random 4-digit PIN, updates hash + display, invalidates leaked PINs).
- **Live KPI Strip (4 compact cards):**
  1. `زيارات اليوم`
  2. `إجمالي الأعضاء`
  3. `قربوا على الهدية (4–5 أختام)`
  4. `وجبات مجانية تم صرفها`
- **Quick Settings Form:** Edit `min_bill_egp`, `reward_title`, `reward_terms`, `cooldown_hours`, `stamps_required`.
- **Recent Activity Table (Last 20 visits & redemptions):** First name, `****1234`, stamp count, table number, time ago.

### `S10` — Graceful Fallback / Offline Error Screen
- Lightweight static-friendly Arabic screen if DB is unreachable or slug is invalid/inactive:
  - `«المطعم غير متاح حالياً أو الاتصال ضعيف»`
  - Button: `«إعادة المحاولة»`
  - Zero technical errors or stack traces.