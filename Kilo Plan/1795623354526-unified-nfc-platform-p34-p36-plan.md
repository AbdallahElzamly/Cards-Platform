# Plan: Avatar Supabase Storage Upload & Selective Field Privacy Toggles

## Overview
Enhance smart business cards with Supabase Storage avatar uploads (with base64 fallback) and selective field visibility toggles stored inside `social_links.visible_fields` JSONB.

## Detailed Steps & File Plan
1. **Avatar Storage & Upload Helper (`app/actions/dashboard.ts` or client-side):**
   - Support uploading image files to Supabase Storage bucket `avatars` (with graceful fallback to Data URL).
2. **Selective Field Visibility (`visible_fields` in `social_links` JSONB):**
   - Update `UnifiedClientDashboard.tsx` with privacy toggle checkboxes for phone, whatsapp, email, website, instapay, vodafone_cash, and bio.
   - Update `SmartBusinessCardClient.tsx` to conditionally render fields based on `visible_fields` settings.
   - Update `app/api/vcard/[slug]/route.ts` to respect `visible_fields` when generating the `.vcf` file.
3. **Verification & Build:**
   - Run `npx tsc --noEmit` and `npx next build`.
   - Commit and push to `main`.
