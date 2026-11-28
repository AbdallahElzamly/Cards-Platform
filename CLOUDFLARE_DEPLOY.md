# KUWI — دليل النشر على Cloudflare Workers (بدلاً من Vercel)

تم تجهيز المنصة للعمل بالكامل على **Cloudflare Workers** باستخدام محوّل `@opennextjs/cloudflare` الرسمي (يدعم Next.js App Router وServer Actions و`proxy.ts` وملفات الأصول الثابتة).

---

## 1. الطريقة الأولى: النشر المباشر عبر Git من لوحة Cloudflare (الأسهل — نشر تلقائي مع كل Push)

1. ادخل على **Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Import a repository**.
2. اختر مستودع `Cards-Platform` (بعد تحويله إلى **Private**).
3. اضبط إعدادات البناء:
   - **Build command:** `npm run cf:build`
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** `/` (اتركه فارغاً)
4. أضف متغيرات البيئة (Environment Variables & Secrets) داخل إعدادات الـ Worker → **Settings** → **Variables and Secrets**:
   - `NEXT_PUBLIC_SUPABASE_URL` (نص عادي / Plaintext)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (نص عادي / Plaintext)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (نص عادي / Plaintext)
   - `NEXT_PUBLIC_APP_URL` = رابط الدومين الخاص بك على Cloudflare أو الدومين المخصص (مثال: `https://kuwi-cards-platform.<your-subdomain>.workers.dev`)
   - `SUPABASE_SERVICE_ROLE_KEY` (**Secret** — مشفر)
   - `LOYALTY_PEPPER` (**Secret** — مشفر)
   - *(اختياري)* `SUPER_ADMIN_EMAILS` (**Secret**)
5. اضغط **Save and Deploy**.

---

## 2. الطريقة الثانية: النشر من جهازك عبر CLI (Wrangler)

```bash
# 1. تسجيل الدخول مرة واحدة إلى حساب Cloudflare
npx wrangler login

# 2. البناء والنشر مباشرة إلى Cloudflare Workers
npm run cf:deploy

# 3. رفع الأسرار (Secrets) أول مرة أو عند تغييرها
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put LOYALTY_PEPPER
```

> للمعاينة المحلية بمحرك Cloudflare الفعلي قبل النشر: `npm run cf:preview`

---

## 3. تحديث روابط التفعيل في Supabase بعد الحصول على دومين Cloudflare

بعد صدور رابط Cloudflare أو ربط دومينك الخاص (`kuwi.eg` مثلاً)، افتح **Supabase Dashboard → Authentication → URL Configuration**:
1. اضبط **Site URL** على رابط موقعك الجديد (`https://kuwi-cards-platform.<your-subdomain>.workers.dev`).
2. أضف في **Redirect URLs**:
   - `https://kuwi-cards-platform.<your-subdomain>.workers.dev/auth/callback`
   - `https://kuwi-cards-platform.<your-subdomain>.workers.dev/**`
3. تأكد من تفعيل **Confirm email** داخل **Authentication → Providers → Email**.
