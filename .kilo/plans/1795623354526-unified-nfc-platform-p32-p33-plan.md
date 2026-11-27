# Plan: WhatsApp Fix, UI/UX Redesign, Right-Side Navigation Sidebar, and Admin Activation Link Copy

## Overview
Execute remaining enhancements on branch `main` while keeping `/dashboard/loyalty`, `/l/[slug]`, and `loyalty_*` tables 100% untouched:
1. **WhatsApp Normalization & Card Redesign (`SmartBusinessCardClient.tsx`):**
   - Robust number formatter for `wa.me`, rendering only when valid.
   - Professional, refined UI/UX design following `figma-designer` and `landing-page-design` (cohesive glassmorphism, subtle gradients, clean typography, refined payment chips, uncluttered lead form).
2. **Right-Side Navigation Sidebar (`UnifiedClientDashboard.tsx` & `AdminBatchDashboard.tsx`):**
   - Clean Arabic RTL right-hand sidebar (`aside`) for switching sections (`نظرة عامة`, `كروتي الذكية`, `العملاء المحتملون`, `العُهدة والمفقود`) plus quick links to loyalty and admin.
3. **Direct Activation Link Copy in `/admin` (`AdminBatchDashboard.tsx`):**
   - One-click "نسخ رابط التفعيل" button per card row copying `${origin}/activate/<code>` with toast/copied feedback.
4. **Verification & Build:**
   - Run `npx tsc --noEmit` and `npx next build`.
   - Commit and push to `main`.
