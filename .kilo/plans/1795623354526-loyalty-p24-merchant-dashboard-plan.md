# Plan: Task P24 — Merchant Loyalty Dashboard & Management Actions

## Overview
Implement Task P24 of the Loyalty MVP execution plan:
1. `app/actions/loyalty-merchant.ts` (`'use server'`):
   - `getMerchantLoyaltyDashboard`: Verifies authenticated merchant (`auth.getUser()`), resolves or creates a default loyalty program for the user, and computes KPI metrics (total members, stamps last 30 days, active/redeemed vouchers, and recent visits/redemptions feed).
   - `updateLoyaltyProgramSettings`: Updates program settings (`reward_title`, `stamps_required`, `cooldown_hours`, `min_bill_egp`, `is_active`, etc.) strictly scoped to the authenticated owner.
   - `rotateDailyPinAction`: Generates a fresh 4-digit PIN via `generateRandomPin()`, hashes it via `hashDailyPin()`, updates `daily_pin_hash`, `daily_pin_display`, and `pin_rotated_at`, returning the new plaintext PIN for display on the cashier screen.
2. `app/dashboard/loyalty/page.tsx` & `components/loyalty/MerchantLoyaltyDashboard.tsx`:
   - Arabic RTL merchant/cashier control panel showing:
     - Live Cashier Daily PIN card with one-tap rotation button (`rotateDailyPinAction`).
     - NFC Card link card (`/l/[slug]`) with one-tap copy button.
     - 4 KPI cards (Total members, 30d visits, redeemed vouchers, active vouchers).
     - Program settings configuration form.
     - Recent activity feed.

## File Plan
- `app/actions/loyalty-merchant.ts` (new)
- `app/dashboard/loyalty/page.tsx` (new)
- `components/loyalty/MerchantLoyaltyDashboard.tsx` (new)

## Verification & QA
- Verify unauthenticated redirect from `/dashboard/loyalty`.
- Verify PIN rotation updates daily PIN instantly.
- Verify settings updates reflect on customer card.
- Run `npm run build` and `tsc --noEmit`.
