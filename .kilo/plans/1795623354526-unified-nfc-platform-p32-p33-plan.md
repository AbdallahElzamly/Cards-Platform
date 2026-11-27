# Plan: UI/UX Redesign & Upgrade for Smart Business Card (`SmartBusinessCardClient.tsx`)

## Overview
Apply principles from `figma-designer` and `landing-page-design` skills to upgrade `SmartBusinessCardClient.tsx` (`/c/[slug]`) while keeping 100% of existing functionality intact.

## Design Improvements
1. **Visual Hierarchy & Typography:**
   - Use strict Tailwind scale (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`), precise spacing tokens (`p-6`, `gap-4`), and balanced weights.
   - Elegant shadow styling (`shadow-xl shadow-black/10`), rounded corners (`rounded-3xl`), and frosted glass card surfaces.
2. **Profile Header & CTAs:**
   - Crisp avatar frame with subtle ring, clear typography for name, job title, company, and bio.
   - Polished primary action buttons (Call, WhatsApp, Save Contact) with active scale micro-interactions (`active:scale-[0.98]`, smooth `transition-all`).
3. **Secondary Actions & Payment Links:**
   - Clean badges/cards for email, website, Vodafone Cash (with copy feedback), and InstaPay.
4. **Lead Capture Section ("شارك بياناتك معي"):**
   - High-contrast, uncluttered form card with clear input fields, active focus rings, and success/error feedback states.
5. **Preserved Functionality:**
   - 100% backward compatibility with `avatar_url` (initials fallback), visible field privacy toggles (`visible_fields`), `.vcf` download API, WhatsApp/phone/payment actions, and `card_leads` server action submission.

## Validation Plan
1. Run `npx tsc --noEmit` and `npx next build`.
2. Commit and push to `main`.
