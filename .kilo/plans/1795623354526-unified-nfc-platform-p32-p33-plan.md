# Refined Plan: Tasks P32 & P33 — Dynamic Gateway, Activation, Smart Business Card & vCard Export

## Overview
Implement Tasks P32 and P33 on branch `feat/unified-nfc-platform`:
1. **Dynamic Gateway `/q/[code]` & Activation `/activate/[code]` (P32):**
   - `app/q/[code]/page.tsx`: Server-rendered dynamic route with `force-dynamic` and `Cache-Control: no-store`. Handles `unclaimed` (redirects to `/activate/[code]`), `review` (redirects to `target_url`), `business` (redirects to `/c/[slug]`), and `loyalty` (redirects to `/l/[slug]`), recording scans in `scans` (best-effort, non-blocking).
   - `app/activate/[code]/page.tsx`: Self-service card claiming & setup flow requiring Supabase authentication (auto-linking card to `auth.uid()`). Allows setting product type (`business` or `review`) and creating initial business card details or review URL.
2. **Smart Business Card `/c/[slug]`, vCard API, & Lead Capture (P33):**
   - `app/c/[slug]/page.tsx`: Arabic RTL Smart Business Card page with customizable theme color, avatar/logo, bio, direct call, WhatsApp, InstaPay, Vodafone Cash, social links, vCard download button, and lead capture form inserting into `card_leads`.
   - `app/api/vcard/[slug]/route.ts`: API route returning `.vcf` v3.0 file download (`Content-Type: text/vcard`).
3. **Verification:**
   - Run `npx tsc --noEmit` and `npm run build`.
   - Commit changes to `feat/unified-nfc-platform` with message `feat(p32-p33): add /q/[code] gateway, /activate/[code], /c/[slug] business card, and vCard export`.
