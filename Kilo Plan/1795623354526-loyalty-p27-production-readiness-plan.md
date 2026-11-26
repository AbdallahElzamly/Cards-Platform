# Finalized Plan: Task P27 — Loyalty MVP Production Readiness & Deployment Guide

## Overview
Finalize production readiness and deployment documentation for the Loyalty MVP:
1. **Environment Template (`.env.example`):** Create a safe template for required environment variables without real secrets.
2. **Deployment Runbook (`LOYALTY_DEPLOY.md`):** Comprehensive bilingual (Arabic/English) deployment guide covering Supabase setup, RLS verification, environment variables, Vercel deployment, and NFC card programming (`/l/[slug]`).
3. **Final Verification:** Run `npx tsc --noEmit` and `npm run build`.

## Detailed Tasks
1. Create `.env.example` with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LOYALTY_PEPPER`
2. Create `LOYALTY_DEPLOY.md` with full bilingual Arabic & English sections covering Supabase, RLS, Vercel, and NFC tags.
3. Verify project compilation with `npx tsc --noEmit` and `npm run build`.

## Validation Plan
- Run typecheck and production build successfully.
