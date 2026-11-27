# Plan: Fix Card Activation Lookup & Normalization (`/activate/[code]`)

## Overview
Fix the issue where existing unclaimed cards (e.g. `ZQ7C24`) display "الكارت غير موجود في النظام" on `/activate/[code]`.
Root cause: Case sensitivity (`.toUpperCase()` vs `.toLowerCase()`), `ilike` query mismatch, or client-side RLS restrictions when querying `unclaimed` cards prior to authentication.

## Detailed Steps & File Plan
1. **Normalize Code (`app/activate/[code]/page.tsx` & `app/q/[code]/page.tsx`):**
   - Normalize code using `decodeURIComponent(code).trim().toUpperCase()` consistently.
2. **Server-Side Card Lookup for Activation:**
   - In `app/activate/[code]/page.tsx`, fetch the card server-side (or via `supabaseAdmin` / safe query) to ensure `unclaimed` cards are retrieved reliably without RLS blocking unauthenticated or pre-auth views.
3. **Claim & Activate Logic:**
   - Update card (`owner_id = user.id`, `status = 'active'`), create/link `business_cards` with unique slug or set `target_url`, then redirect to `/dashboard` or `/c/[slug]`.
4. **Verification & Commit:**
   - Run `npx tsc --noEmit` and `npm run build`.
   - Commit and push to `main`.
