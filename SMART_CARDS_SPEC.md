# SMART_CARDS_SPEC.md — Unified NFC & Dynamic QR Platform Architecture

## 1. Architecture Overview
`Cards-Platform` is a unified NFC and Dynamic QR platform supporting three primary product verticals:
1. **Smart Business Cards (`business`):** Professional digital business cards (`/c/[slug]`) with instant contact saving (`.vcf`), lead capture, payment links, and social links.
2. **Google Review Cards (`review`):** Instant redirect cards forwarding visitors directly to Google Maps / Review links with tracking (`scans`).
3. **Restaurant NFC Loyalty (`loyalty`):** Zero-cost restaurant loyalty program (`/l/[slug]`) with stamps, cashier daily PINs, and golden vouchers (isolated `loyalty_*` tables).

---

## 2. Core Routing & Gateway (`/q/[code]`)
- Dynamic HTTP `302` or `307` temporary redirect with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`.
- Looks up `code` in the `cards` table:
  - If product is `loyalty` → redirect to `/l/[slug]?t=[table]` (using card metadata or associated loyalty program slug).
  - If product is `business` → redirect to `/c/[slug]`.
  - If product is `review` → redirect to `target_url`.
  - If status is `unclaimed` → redirect to `/activate/[code]`.
  - If not found or suspended → clean 404/fallback screen.

---

## 3. Key Pages & Endpoints (`P32`–`P35`)
- **`/c/[slug]`:** Arabic RTL Smart Business Card page + `/api/vcard/[slug]` (`.vcf` v3.0 download) + visitor lead capture form.
- **`/activate/[code]`:** Self-service card claiming & setup flow for pre-printed cards.
- **`/dashboard`:** Smart unified dashboard showing tabs/products owned by `auth.uid()` (Smart Business Cards, Google Review Cards, and Loyalty program).
- **`/admin`:** Protected bulk batch generator (`CSV` export) restricted to `ADMIN_EMAILS`.
