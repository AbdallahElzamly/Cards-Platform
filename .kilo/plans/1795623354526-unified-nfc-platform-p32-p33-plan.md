# Plan: Custody Reassignment, Fleet Tracking, Share Presets, and Lost Card Mode

## Overview
Implement Batch 2 (Custody Reassignment & Fleet Tracking) and Batch 3 (Share Presets & Lost Card Mode) on branch `main` while keeping `/dashboard/loyalty`, `/l/[slug]`, and `loyalty_*` tables 100% untouched.

## Detailed Steps & File Plan
1. **Database Migration (`supabase/migrations/20261127_smart_cards_platform.sql` or new `20261127_cards_status_lost.sql`):**
   - Add `'lost'` to `cards.status` check constraint.
   - Add coarse geolocation columns to `scans` (`city`, `country`) if desired, or read headers.
2. **Custody Reassignment & Fleet Tracking (Batch 2):**
   - In `app/actions/dashboard.ts`, add `reassignCardCustodyAction` (reset/update employee profile details and optionally clear/archive `card_leads` for that card).
   - In `UnifiedClientDashboard.tsx`, add fleet overview with per-card scan counts, lead counts, lead filtering, export per card, and custody transfer/reset modal or form.
3. **Share Presets & Lost Card Mode (Batch 3):**
   - In `UnifiedClientDashboard.tsx`, add quick share preset buttons (`الكل`, `بيانات العمل فقط`, `التواصل الاجتماعي والمدفوعات`) to toggle `visible_fields` in bulk.
   - In `SmartBusinessCardClient.tsx`, handle Lost Card Mode (`status === 'lost'`) displaying a recovery notice and contact option while logging scan events with coarse geo headers.
   - In `/api/vcard/[slug]/route.ts`, respect visibility presets.
4. **Verification & Push:**
   - Run `npx tsc --noEmit` and `npx next build`.
   - Commit and push to `main`.
