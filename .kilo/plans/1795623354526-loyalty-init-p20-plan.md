# Plan: Next.js 15 Initialization & Task P20 (Loyalty Database Migration & Types)

## Overview
This plan covers the initial setup of the Next.js 15 project (App Router, TypeScript, Tailwind CSS) with Arabic RTL (`dir="rtl"`, `lang="ar"`, Cairo Google Font) and `.env.local` in `.gitignore`, followed by Task P20 execution (isolated `loyalty_*` tables migration and `types/loyalty.ts`).

## File Plan

### Phase 1: Next.js 15 Initialization & Configuration
- **Files Affected / Created:**
  - `package.json` (Next.js 15, React 19 / 18, Tailwind CSS, TypeScript dependencies)
  - `tsconfig.json` (TypeScript configuration)
  - `tailwind.config.ts` (Tailwind CSS configuration)
  - `postcss.config.mjs` (PostCSS configuration)
  - `next.config.mjs` (Next.js configuration)
  - `app/layout.tsx` (Root layout with `dir="rtl"`, `lang="ar"`, Cairo Google Font import and class)
  - `app/globals.css` (Tailwind CSS base, components, utilities)
  - `.gitignore` (Ensuring `.env.local` and `.next` are ignored)

### Phase 2: Task P20 — Database Schema & RLS Migration & TypeScript Types
- **Files Affected / Created:**
  - `supabase/migrations/20261125_loyalty_mvp.sql` (Idempotent SQL migration for `loyalty_programs`, `loyalty_members`, `loyalty_visits`, `loyalty_vouchers`, `loyalty_pin_attempts`, indexes, strict RLS policies, atomic redemption helper function, and test-cafe seed block)
  - `types/loyalty.ts` (TypeScript interfaces matching all 5 tables and related types)

## Security & Guardrails Checklist
- Zero destructive changes to existing tables (`cards`, `scans`).
- Isolated `loyalty_*` tables with RLS enabled and zero `anon` access to sensitive columns (`daily_pin_hash`, `daily_pin_display`, `loyalty_pin_attempts`).
- Strict separation from Google Reviews.
- Zero-cost architecture compliance.
