# Plan: Tasks P34, P35 & P36 — Admin Batch Generator, Smart Unified Dashboard, and Platform Landing Page

## Overview
Implement Tasks P34, P35, and P36 on branch `feat/unified-nfc-platform` while keeping `/dashboard/loyalty` and `/l/[slug]` 100% untouched and operational:
1. **Admin Bulk Batch Generator & Card Manager (`/admin` - P34):**
   - Protected route `app/admin/page.tsx` checking user email against `process.env.ADMIN_EMAILS` (comma-separated list, showing Arabic RTL "غير مصرح بالدخول" if unauthorized).
   - Bulk code generator: creates 1 to 500 unambiguous uppercase alphanumeric 6-character codes (`status = 'unclaimed'`) into `cards`.
   - Print-ready CSV export (UTF-8 with BOM) containing `code,product,batch_name,status,qr_url`.
   - Cards management table with filters (`batch_name`, `status`), search (`code`), and inline status/target_url updates.
2. **Smart Unified Customer Dashboard (`/dashboard` - P35):**
   - `app/dashboard/page.tsx`: Redirects unauthenticated users to `/auth/login?redirect=/dashboard`.
   - Queries `cards` (with joined `business_cards` and `scans` count) and `loyalty_programs` owned by `auth.uid()`.
   - Renders `components/dashboard/UnifiedClientDashboard.tsx` in Arabic RTL adapting dynamically:
     - Smart Cards tab (`business` / `review`): live scan counts, editor for `business_cards` or `target_url`, copyable `/q/[code]` and `/c/[slug]` links, and `card_leads` list with CSV export.
     - Loyalty tab: prominent card linking directly to `/dashboard/loyalty`.
     - Empty state: quick card activation input box redirecting to `/activate/<code>`.
3. **Unified Platform Landing Page (`/` - P36):**
   - Updated `app/page.tsx` presenting two distinct paths for **KUWI**:
     - Smart Business Cards & Google Review Cards (NFC / QR).
     - Restaurant & Cafe Loyalty System (6th meal free).
4. **Verification & Commit:**
   - Run `npx tsc --noEmit` and `npm run build`.
   - Commit changes to `feat/unified-nfc-platform` with message `feat(p34-p36): add /admin batch generator, smart /dashboard, and unified landing page`.
