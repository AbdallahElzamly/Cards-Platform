# Plan: Task P23 — Customer Loyalty UI at `/l/[slug]`

## Overview
Implement Task P23 of the Loyalty MVP execution plan:
1. `app/l/[slug]/page.tsx`: Server Component fetching active loyalty program by slug, fetching member card state via `getMemberCardState`, handling inactive/404 states gracefully, and rendering the customer experience.
2. `components/loyalty/CustomerLoyaltyCard.tsx` (`'use client'`):
   - Step 1 (First visit / Unauthenticated): Lightweight Arabic form (First name, Egyptian mobile number with LTR numeric keypad, 4-digit Cashier PIN with LTR numeric input, privacy consent checkbox, calling `lookupOrRegisterAndStamp`).
   - Step 2 (Returning / Stamped member): Visual 6-stamp grid (filled vs remaining stamps, golden gift icon on stamp 6, goal-gradient psychology at stamps 4–5), tier badge (`برونزي` / `فضي` / `ذهبي`), cooldown notice when within cooldown hours, "اختم زيارتي اليوم" button opening PIN modal, "تبديل الرقم / ليس أنا؟" button calling `switchAccountAction`, and Golden 6th-Visit Voucher Banner (`قسيمة هديتك جاهزة!`) with Cashier PIN modal calling `redeemVoucherAction`.
3. `app/l/[slug]/error.tsx` & `app/l/[slug]/not-found.tsx` (`S10` Fallback screen).

## File Plan
- `app/l/[slug]/page.tsx` (new)
- `components/loyalty/CustomerLoyaltyCard.tsx` (new)
- `app/l/[slug]/error.tsx` (new)
- `app/l/[slug]/not-found.tsx` (new)

## Verification & QA
- Verify Arabic RTL layout and Cairo font styling.
- Verify Egyptian phone number input (`dir="ltr"`, `inputMode="numeric"`).
- Verify 4-digit Cashier PIN input behavior.
- Run `npm run build` and `tsc --noEmit`.
