# Plan: Fix Card Leads Flow (`card_leads`) from `/c/[slug]` to `/dashboard`

## Overview
Fix the issue where leads submitted from the "شارك بياناتك معي" form on `/c/[slug]` do not appear in `/dashboard` by routing lead insertion through a secure server action (`app/actions/leads.ts`) using `supabaseAdmin` and ensuring robust querying in `/dashboard`.

## Detailed Steps & File Plan
1. **Create Server Action (`app/actions/leads.ts`):**
   - Create `'use server'` action `submitCardLeadAction(formData)` that validates `business_card_id`, `visitor_name`, and `visitor_phone`, and inserts into `card_leads` using `supabaseAdmin` (bypassing any client-side RLS block). Returns success/error status and surfaces exact error messages if any.
2. **Update Client Component (`SmartBusinessCardClient.tsx`):**
   - Call `submitCardLeadAction` instead of direct browser client `.from('card_leads').insert()`.
3. **Verify Dashboard Query (`app/dashboard/page.tsx`):**
   - Ensure dashboard correctly queries `card_leads` joined with `business_cards` owned by `auth.uid()`.
4. **Validation & Build:**
   - Run `npx tsc --noEmit` and `npm run build`.
   - Commit and push to `main`.
