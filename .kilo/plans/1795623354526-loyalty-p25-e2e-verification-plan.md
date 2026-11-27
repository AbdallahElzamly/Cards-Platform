# Plan: Task P25 — End-to-End Verification, Route Integration, and Deployment Readiness

## Overview
Implement Task P25 of the Loyalty MVP execution plan:
1. **Security & Privacy Audit:** Verify zero leakage of `daily_pin_hash`, `daily_pin_display`, or `phone_hash` across server actions, client components, and public database queries. Confirm strict separation from Google Reviews.
2. **Landing / Entry Overview (`app/page.tsx`):** Update or create a clean, modern Arabic RTL landing / navigation page linking directly to `/dashboard/loyalty` and sample `/l/test-cafe` testing without breaking existing platform features.
3. **Smoke Test & Verification:** Run TypeScript typecheck (`npx tsc --noEmit`) and production build (`npm run build`).

## File Plan
- `app/page.tsx` (update/create with Arabic RTL loyalty navigation and testing links)
- Verification check on all existing loyalty files (`app/actions/loyalty.ts`, `app/actions/loyalty-merchant.ts`, `app/l/[slug]/page.tsx`, `components/loyalty/CustomerLoyaltyCard.tsx`, `app/dashboard/loyalty/page.tsx`, `components/loyalty/MerchantLoyaltyDashboard.tsx`)

## Verification & QA
- Run `npx tsc --noEmit` and `npm run build`.
- Confirm zero errors and successful production build.
