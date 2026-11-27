# KUWI Unified Multi-Tenant NFC Platform — Master Architecture Plan (`P37`–`P40`)

## 1. Architectural Vision (Decentralized Multi-Entity Ownership)
Transform KUWI from a single-admin card tool into a self-serve, multi-tenant SaaS platform serving **three autonomous customer segments** on one unified Next.js 16 + Supabase stack:

1. **Individuals (الأفراد والمهندسون والمهنيون):**
   - Self-serve 1-step activation (`/activate/[code]`) with inline account creation (`email_confirm: true` via server admin API), instant Admin Express Provisioning (`admin_provisioned: true` allowing live `/q/[code]` operation before client claim), OR a guided **3-Step Conversational Onboarding Wizard** (`IndividualOnboardingWizard`) inside `/dashboard` when `cards.length === 0`.
   - **Strict Server Quota & UI Isolation (5-Team FAANG Verdict):** Individual accounts are hard-capped at `1` starter card (`batch_name = 'SELF_INDIVIDUAL'`) and see **ONLY** their 4 personal tabs (`بطاقتي وتعديل البيانات`, `رمز الـ QR والمشاركة`, `من تواصل معي`, `الخصوصية ووضع الفقدان`). Zero Company Fleet, Custody Reassignment, Ownership Transfer, or Restaurant Loyalty surfaces are ever rendered or accessible to individual users.
   - Full support for dual phone numbers (`phone` + `social_links.phone2`), WhatsApp, LinkedIn, Instagram, Facebook, TikTok, Telegram, X, YouTube, GitHub, Google Maps pin, Custom Portfolio/CV URL, Vodafone Cash, InstaPay, 5 architectural themes (`obsidian`, `titanium`, `pearl`, `emerald`, `amber`), QR share modal, UTF-8 `.vcf` vCard 3.0 download, and selective privacy presets.
2. **Corporate Clients & Teams (الشركات وإدارة الأسطول):**
   - Multi-tenant Company Workspaces (`companies` table linked via `contact_email` + `batch_name`), provisioned strictly by Super Admin from `/admin` (generating $N$ pre-linked paid employee NFC cards immediately; public self-minting of companies or unlimited cards is disabled to protect server resources).
   - Full Authenticated Fleet Console inside `/dashboard` AND `/org/[slug]` (gated to Super Admin or matching `company.contact_email`): reassign employee custody when staff leave without reprinting physical NFC cards, monitor scan & lead KPIs, and export unified CRM leads to UTF-8 BOM Excel CSV.
3. **Restaurants & Cafes (نظام ولاء المطاعم):**
   - Provisioned B2B `loyalty_programs` (zero public auto-minting for individual accounts), isolated `loyalty_*` tables, rotating daily 4-digit Cashier PIN, 365-day `HttpOnly` session cookie + 1-tap phone card recovery, continuous GPU-accelerated celebration animations, and raw merchant phone retention for WhatsApp/call re-engagement.

---

## 2. Design System (`elayadesign/ai-design-skills` + `apple-hig-cro`)
- **Flat Architectural Surfaces:** `#000000`, `#181818`, `#1F1F1F`, `#272727` (Dark) and `#FAFAFA`, `#FFFFFF` (Light); zero background gradients; text gradient strictly reserved for the Hero `h1` (`#FFFFFF` → `#9B9B9B`).
- **Full-Perimeter 1px Borders & Nested Radius Formula:** `inner_radius = outer_radius - gap` (`rounded-3xl` outer cards with `rounded-2xl` / `rounded-xl` inner controls).
- **Typography & Copy:** `Cairo` sans-serif on strict Tailwind type scale, max `680px` hero measure, `text-wrap: balance` on headings, zero italics, zero ultra-bold `font-black` clutter on marketing/card surfaces.
- **Motion & Tagline Reveal:** Weighted `cubic-bezier(0.22, 1, 0.36, 1)` transitions (`transform` & `opacity` only), 44px–52px Apple HIG touch targets, and mandatory word-by-word `IntersectionObserver` `TaglineReveal` section respecting `prefers-reduced-motion`.
- **Vector Iconography:** Uniform `1.75px` stroke Phosphor-style SVG icons in `components/ui/Icons.tsx`.

---

## 3. Route Map & Authorization Matrix
| Route | Audience | Behavior |
|---|---|---|
| `/` | Public | High-converting dark architectural landing page + pricing (300 EGP individual card, 365-day guarantee, custom B2B fleets) + FAQ |
| `/q/[code]` | Public NFC/QR | Dynamic `force-dynamic` gateway recording scan & routing to `/c/[slug]`, `/l/[slug]`, `target_url`, Lost Mode, or `/activate/[code]` |
| `/c/[slug]` | Public | Executive Digital Identity Pass + `.vcf` vCard + QR Modal + Two-Way Lead Capture |
| `/activate/[code]` | Buyer | 1-Step Account Creation/Login + Card Activation & Ownership Claim |
| `/dashboard` | Individual / Provisioned Company Admin | Role-Isolated Studio: 3-Step Onboarding Wizard + 4 Personal Tabs for Individuals; Fleet & Custody Tabs strictly for Provisioned Companies |
| `/org/[slug]` | Authenticated Company HR / Super Admin | Auth-gated Company Fleet Portal & Custody Reassignment (`contact_email` or Super Admin) |
| `/dashboard/loyalty` | Provisioned Restaurant Merchant | Cashier Daily PIN, NFC Table Link Builder, KPIs, Raw Phone Retention CRM (redirects unprovisioned individuals to `/dashboard`) |
| `/admin` | Super Admin (`lib/admin-auth.ts`) | Express Individual Client Builder (with 1-click preset), Express B2B Company + Fleet Generator, Bulk CSV Print Inventory |
