# Plan: Server-Side Card Activation Mutation Fix (`app/actions/cards.ts`)

## Overview
Ensure card activation runs 100% securely on the server via a server action (`'use server'`) using `supabaseAdmin` to avoid browser-side RLS `permission denied for table cards`.

## Detailed Steps & File Plan
1. **Server Action (`app/actions/cards.ts`):**
   - Verify authenticated session via `createServerClient` + `supabase.auth.getUser()`.
   - Normalize `code` (`code.trim().toUpperCase()`).
   - Use `supabaseAdmin` to fetch the card and verify `status === 'unclaimed'`.
   - Update `cards` (`owner_id = user.id`, `status = 'active'`, `product`, `target_url`).
   - If `product === 'business'`, insert/link row in `business_cards` with unique slug and submitted details.
2. **Client Component (`ActivateCardClient.tsx`):**
   - Invoke `activateCardAction` server action on form submission.
3. **Validation & Build:**
   - Run `npx tsc --noEmit` and `npm run build`.
   - Commit and push to `main`.
