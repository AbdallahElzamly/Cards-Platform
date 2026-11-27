# Plan: Audit & Fix Card Activation `permission denied for table cards` Error

## Overview
Investigate and resolve the `permission denied for table cards` error occurring during card activation on `/activate/[code]`.

## Detailed Audit & Plan
1. **Codebase Audit:**
   - Search all files for `.from('cards')` and `.from('business_cards')` to ensure no client-side (`'use client'`) component attempts direct table mutations.
2. **Server Action Refinement (`app/actions/cards.ts`):**
   - Ensure `supabaseAdmin` is instantiated cleanly using `process.env.SUPABASE_SERVICE_ROLE_KEY`. If `SUPABASE_SERVICE_ROLE_KEY` is missing or empty, return an explicit diagnostic error (`مفتاح الخدمة SUPABASE_SERVICE_ROLE_KEY غير مضبوط في البيئة`).
   - Log and surface exact Supabase error properties (`error.message`, `error.code`, `error.details`) rather than generic messages.
3. **Database / RLS / Trigger Inspection:**
   - Review migration `supabase/migrations/20261127_smart_cards_platform.sql` to verify RLS policies and foreign key constraints on `cards` and `business_cards`.
4. **Validation:**
   - Run `npx tsc --noEmit` and `npm run build`.
   - Commit and push to `main`.
