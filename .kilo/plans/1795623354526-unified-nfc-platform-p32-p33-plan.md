# Plan: Secure Server Action for Card Activation (`app/actions/cards.ts`)

## Overview
Fix the `permission denied for table cards` error during card activation by implementing a secure server action (`'use server'`) that uses `supabaseAdmin` after verifying the authenticated user session via Supabase Auth.

## Detailed Steps & File Plan
1. **Create `app/actions/cards.ts` (`'use server'`):**
   - Verify authenticated user via `createServerClient` + `supabase.auth.getUser()`.
   - Normalize code (`code.trim().toUpperCase()`).
   - Fetch card using `supabaseAdmin` and verify `status === 'unclaimed'`.
   - Update `cards` (`owner_id = user.id`, `status = 'active'`, `product`, `target_url`).
   - If `product === 'business'`, insert/link row in `business_cards` with unique slug and submitted details.
   - Return `{ success: boolean; error?: string; slug?: string }`.
2. **Update `ActivateCardClient.tsx`:**
   - Call `activateCardAction` server action instead of browser client table mutations.
3. **Verification & Commit:**
   - Run `npx tsc --noEmit` and `npm run build`.
   - Commit and push to `main`.
