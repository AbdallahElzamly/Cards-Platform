# Refined Plan: Unified NFC & Dynamic QR Platform Setup (Tasks P30 & P31)

## Overview
Expand `Cards-Platform` into a unified NFC & Dynamic QR platform while keeping the existing loyalty system (`/dashboard/loyalty`, `/l/[slug]`, and `loyalty_*` tables) 100% untouched and operational.

## Task P30: Git Isolation & Architecture Spec
- **Branch:** Create and switch to `feat/unified-nfc-platform`.
- **Specification Document (`SMART_CARDS_SPEC.md`):**
  - `/q/[code]`: Dynamic HTTP 302 (`Cache-Control: no-store`) gateway routing `loyalty` -> `/l/[slug]`, `business` -> `/c/[slug]`, `review` -> `target_url`, and `unclaimed` -> `/activate/[code]`.
  - `/c/[slug]`: Arabic RTL Smart Business Card page + `/api/vcard/[slug]` (`.vcf` v3.0 download) + lead capture form.
  - `/activate/[code]`: Self-service card claiming & setup flow for pre-printed cards.
  - `/dashboard`: Smart unified dashboard showing only the tabs/products owned by `auth.uid()`.
  - `/admin`: Protected bulk batch generator (`CSV` export) restricted to `ADMIN_EMAILS`.

## Task P31: Modular Database Schema & Types
- **Migration (`supabase/migrations/20261127_smart_cards_platform.sql`):**
  - `cards`: id, code (unique), owner_id, product (`'business'|'review'|'loyalty'`), status (`'unclaimed'|'active'|'suspended'`), target_url, batch_name, created_at.
  - `business_cards`: id, card_id (unique reference), slug (unique), full_name, job_title, company, bio, avatar_url, theme_color, phone, whatsapp, email, website, instapay_url, vodafone_cash, social_links (jsonb default '{}'::jsonb), is_active, created_at.
  - `card_leads`: id, business_card_id, visitor_name, visitor_phone, visitor_note, created_at.
  - `scans`: id, card_id, scanned_at, device_type.
  - **RLS Policies:** Enable RLS on all 4 tables. Public SELECT on active cards/business_cards; public INSERT on `card_leads` and `scans`; owner full access via `auth.uid()`.
- **TypeScript Types (`types/smart-cards.ts`):**
  - Interfaces for `Card`, `BusinessCard`, `CardLead`, `Scan`, and related DTOs.

## Verification & Stop Condition
- Run `npx tsc --noEmit`.
- Commit changes to `feat/unified-nfc-platform` with message `feat(p30-p31): add unified nfc platform spec, sql migration, and types`.
- Stop after P31 and report created files (`.kilo\plans\1795623354526-unified-nfc-platform-p30-p31-plan.md`) for Supabase migration execution.
