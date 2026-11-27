# Finalized Plan: Arabic RTL Merchant Login Page (`app/auth/login/page.tsx`)

## Overview
Create a clean Arabic RTL merchant login page at `app/auth/login/page.tsx` using Supabase Auth (`signInWithPassword` and a toggle for `signUp`) that respects the `redirect` search parameter (defaulting to `/dashboard/loyalty`) and redirects upon successful authentication.

## File Plan
- **`app/auth/login/page.tsx`** (new Client Component):
  - Arabic RTL layout (`dir="rtl"`, Cairo font).
  - Email and password input fields.
  - Mode toggle between Login (`signInWithPassword`) and Sign Up (`signUp`) for testing convenience.
  - Supabase browser client auth integration (`createBrowserClient` from `@supabase/ssr`).
  - Reads `redirect` search param via `useSearchParams()`.
  - Error handling with friendly Arabic messages.
  - Success redirect to the target destination (`/dashboard/loyalty` or custom searchParam).

## Validation Plan
1. Run TypeScript type check (`npx tsc --noEmit`) and Next.js build (`npm run build`).
2. Commit and push (`git add -A && git commit -m "feat(auth): add merchant login page for loyalty dashboard" && git push`).
