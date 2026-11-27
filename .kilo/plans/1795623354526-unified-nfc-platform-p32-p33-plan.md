# Plan: Fix Supabase Client Initialization & Error Resilience Across Dashboard & Gateway

## Overview
Fix the Supabase client initialization error (`Error: Your project's URL and Key are required to create a Supabase client!`) on `/dashboard` and other server/client routes by ensuring a robust, consistent fallback chain for environment variables across all `createServerClient` and `createBrowserClient` calls, and adding graceful error handling for missing keys or sessions.

## Detailed Steps & File Plan
1. **Supabase Client Fallback Standardization:**
   - Audit all files using `createServerClient` or `createBrowserClient` (`app/dashboard/page.tsx`, `app/admin/page.tsx`, `app/actions/admin.ts`, `app/actions/dashboard.ts`, `app/actions/loyalty-merchant.ts`, `components/cards/SmartBusinessCardClient.tsx`, `components/admin/AdminBatchDashboard.tsx`, `components/dashboard/UnifiedClientDashboard.tsx`, `app/activate/[code]/page.tsx`, `app/auth/login/page.tsx`, etc.).
   - Ensure Key fallback: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'public-key-placeholder'`.
   - Ensure URL fallback: `process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'`.
2. **Graceful Error Resilience:**
   - In `app/dashboard/page.tsx`, `app/admin/page.tsx`, `app/activate/[code]/page.tsx`, and `app/q/[code]/page.tsx`, guard against missing environment variables or DB connection errors, rendering friendly fallback screens instead of throwing unhandled exceptions.
3. **Verification & Commit:**
   - Run `npx tsc --noEmit` and `npm run build`.
   - Commit and push to `feat/unified-nfc-platform`.
