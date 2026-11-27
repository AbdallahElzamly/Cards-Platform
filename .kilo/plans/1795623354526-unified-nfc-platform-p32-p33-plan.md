# Refined Plan: Add Profile Photo (`avatar_url`) Support to Smart Business Cards

## Overview
Add robust support for profile photos (`avatar_url`) across card activation (`/activate/[code]`), the smart business card view (`/c/[slug]`), and the unified customer dashboard (`/dashboard`), supporting both direct image URLs and image file uploads (converted to Data URL / Base64 on the client side).

## Detailed Steps & File Plan
1. **Server Actions (`app/actions/cards.ts` & `app/actions/dashboard.ts`):**
   - Accept `avatar_url` (string / data URL) in `activateCardAction` and `updateBusinessCardAction` and persist it to `business_cards.avatar_url`.
2. **Client Components (`ActivateCardClient.tsx`, `UnifiedClientDashboard.tsx`, `SmartBusinessCardClient.tsx`):**
   - Provide both a direct image URL text input and a file picker (using `FileReader` to convert uploaded image files to Base64 data URLs).
   - Render `avatar_url` inside the circular profile slot on `/c/[slug]` (`SmartBusinessCardClient.tsx`) with an initials fallback on load error or missing image.
3. **Verification & Build:**
   - Run `npx tsc --noEmit` and `npx next build`.
   - Commit and push to `main`.
