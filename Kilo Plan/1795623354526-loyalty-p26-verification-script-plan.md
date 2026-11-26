# Plan: Task P26 — End-to-End Verification Script & Smoke Tests

## Overview
Implement Task P26 of the Loyalty MVP execution plan by creating an automated verification / smoke test script (`scripts/verify-loyalty.ts`) and helper to test all core loyalty scenarios against Supabase/Server Actions:
1. Phone normalization (`normalizeEgyptianPhone`) with Western (`010...`) and Arabic-Indic (`٠١٠...`) numbers.
2. Daily PIN hashing and verification (`hashDailyPin`, `verifyDailyPin`, `rotateDailyPinAction`).
3. Session cookie signing and verification (`signLoyaltySession`, `verifyLoyaltySession`).
4. Cooldown calculation logic and atomic voucher redemption (`redeem_loyalty_voucher`).

## File Plan
- `scripts/verify-loyalty.ts` (new automated verification script using Node.js assertions against core crypto and helper functions)

## Verification & QA
- Run script via `npx tsx scripts/verify-loyalty.ts` (or node).
- Run `npx tsc --noEmit` and `npm run build`.
