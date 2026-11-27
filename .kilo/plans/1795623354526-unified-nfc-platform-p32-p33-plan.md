# Plan: Fix WhatsApp Links, Add Ownership Transfer, and Redesign /c/[slug] with AI Design Skills

## Overview
Address three key requirements on branch `main` while keeping `/dashboard/loyalty`, `/l/[slug]`, and `loyalty_*` tables 100% untouched:
1. **WhatsApp Link Normalization (`SmartBusinessCardClient.tsx`):** Normalize Egyptian/international numbers for `wa.me` (strip `+`, spaces, dashes, leading `00`; prepend `20` for 11-digit numbers starting with `01`).
2. **Card Ownership Transfer (`app/actions/dashboard.ts`, `app/actions/admin.ts`, `UnifiedClientDashboard.tsx`):** Implement `transferCardOwnershipAction` allowing card owners/admins to transfer `owner_id` to a customer's registered email address.
3. **UI/UX Redesign (`SmartBusinessCardClient.tsx`):** Apply `figma-designer` and `landing-page-design` principles for a cohesive, elegant, modern mobile-first card UI derived from `theme_color`, with crisp typography, refined action rows, and polished lead capture form.

## Detailed Steps & File Plan
1. **WhatsApp Normalization & UI/UX Redesign (`SmartBusinessCardClient.tsx`):**
   - Helper function `formatWhatsAppNumber(raw)` returning clean `https://wa.me/...` or `null`.
   - Redesign card surface, glassmorphism, avatar presentation, button hierarchy, and lead capture form.
2. **Card Ownership Transfer Action (`app/actions/dashboard.ts`):**
   - `transferCardOwnershipAction(cardId, recipientEmail)`: looks up user by email via admin API or profiles/auth, and updates `cards.owner_id`.
   - Add transfer card modal/form in `UnifiedClientDashboard.tsx`.
3. **Verification & Push:**
   - Run `npx tsc --noEmit` and `npx next build`.
   - Commit and push to `main`.
