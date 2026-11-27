# Finalized Plan: Admin Separation (Individuals vs Companies) & Interactive Company Portal (`/org/[slug]`)

## Overview
Implement clear separation between Individuals (الأفراد) and Companies (الشركات) inside `/admin`, plus a dedicated interactive Company Workspace view/route on branch `main` while keeping `/dashboard/loyalty`, `/l/[slug]`, and `loyalty_*` tables 100% untouched.

## Detailed Steps & File Plan
1. **Admin Separation (`AdminBatchDashboard.tsx`, `app/admin/page.tsx`, `app/actions/admin.ts`):**
   - Split `/admin` into two distinct tabs: **الأفراد (Individuals)** and **الشركات (Companies)**.
   - Individuals tab: Batch generation, direct activation link copy (`/activate/<code>`), status management, and individual ownership transfer.
   - Companies tab: Create/manage company workspaces (name, contact email, assigned batch), generate/copy a shareable **Company Interactive Portal Link** (`/org/[slug]`), and view summary stats.
2. **Interactive Company Portal (`app/org/[slug]/page.tsx` & `CompanyPortalClient.tsx`):**
   - Card Links for NFC / QR (`/q/[code]`, employee name, status).
   - Who each card connected with (`card_leads`, visitor name, phone, note, timestamp, scan counts).
   - One-click Excel CSV export with UTF-8 BOM (`\uFEFF`).
   - Employee custody / reassignment (`تحديث عُهدة الموظف` & clearing leads option).
3. **Verification & Push:**
   - Run `npx tsc --noEmit` and `npm run build` with zero errors.
   - Commit all changes and push to `main`.
