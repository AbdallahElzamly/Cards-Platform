# 🚀 Loyalty MVP Deployment & Runbook Guide
## دليل نشر وتشغيل نظام الولاء (NFC / QR)

---

### 1. Overview / نظرة عامة
This document outlines the end-to-end production deployment and configuration steps for the zero-cost Restaurant NFC/QR Loyalty module (`cards-platform`), built with Next.js 15 (App Router, TypeScript, Tailwind CSS) and Supabase PostgreSQL.

---

### 2. Environment Variables / متغيرات البيئة (`.env.local`)
Never expose `SUPABASE_SERVICE_ROLE_KEY` or `LOYALTY_PEPPER` to client code.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
LOYALTY_PEPPER=generate_64_char_hex_secret
```

Generate a secure pepper via Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. Supabase Database & RLS Setup / إعداد قاعدة البيانات وسياسات الأمان
1. Open your Supabase Dashboard → SQL Editor.
2. Run the migration script located at `supabase/migrations/20261125_loyalty_mvp.sql`.
3. Verify that Row-Level Security (RLS) is **Enabled** on all 5 tables (`loyalty_programs`, `loyalty_members`, `loyalty_visits`, `loyalty_vouchers`, `loyalty_pin_attempts`).

---

### 4. Vercel Deployment / النشر على Vercel
1. Push your repository to GitHub.
2. Import project into Vercel.
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOYALTY_PEPPER`) in Vercel Project Settings → Environment Variables.
4. Deploy!

---

### 5. NFC Card Programming / برمجة كروت NFC
Program each restaurant table NFC chip (`NTAG215`) or QR code to point to:
```text
https://yourdomain.com/l/restaurant-slug?t=table_number
```
Example: `https://cards-platform.vercel.app/l/test-cafe?t=3`
