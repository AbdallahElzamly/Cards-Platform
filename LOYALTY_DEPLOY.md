# 🚀 دليل النشر والتشغيل الكامل — نظام ولاء المطاعم (Cards Platform)

---

## 1. خطوة واحدة مهمة داخل Supabase SQL Editor
افتح لوحة تحكم Supabase الخاصة بك (`zzcgpngyovrgglanfbxx`) ← **SQL Editor** ← نفّذ ملف [`supabase/FIX_SUPABASE_PERMISSIONS.sql`](./supabase/FIX_SUPABASE_PERMISSIONS.sql) (لإعطاء صلاحيات الجداول لدور السيرفر `service_role` و `authenticated` ومنع خطأ `42501 permission denied`).

> **نصيحة للاختبار السريع:** من داخل Supabase Dashboard ← **Authentication** ← **Providers** ← **Email**، يمكنك إيقاف خيار **Confirm email** إذا أردت تسجيل حساب تاجر جديد والدخول فوراً دون انتظار رسالة تفعيل الإيميل.

---

## 2. متغيرات البيئة المطلوبة على Vercel (`Settings → Environment Variables`)
أضف المتغيرات الأربعة التالية مع تفعيلها لبيئات **Production** و **Preview** و **Development**:

| الاسم (Key) | الوصف | النوع |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase (`https://....supabase.co`) | Config |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | المفتاح العام (`sb_publishable_...`) — *يدعم الكود أيضاً `NEXT_PUBLIC_SUPABASE_ANON_KEY`* | Config |
| `SUPABASE_SERVICE_ROLE_KEY` | المفتاح السري للسيرفر (`sb_secret_...`) — **لا تضف له بادئة `NEXT_PUBLIC_` أبداً** | Secret |
| `LOYALTY_PEPPER` | سر التشفير السداسي عشري (64 حرفاً) | Secret |

بعد حفظ المتغيرات في Vercel، اضغط **Deployments → Redeploy** على آخر عملية رفع ليتم تفعيل البناء الجديد.

---

## 3. المسارات الجاهزة في النظام
- **`/`**: الصفحة الرئيسية التعريفية.
- **`/auth/login`**: تسجيل دخول / إنشاء حساب التاجر (عبر Server Actions آمنة بدون أخطاء CORS أو `Failed to fetch`).
- **`/dashboard/loyalty`**: لوحة تحكم التاجر والكاشير (تدوير الكود اليومي، نسخ روابط NFC/QR للطاولات، الـ 4 مؤشرات الحية، الإعدادات، وسجل الزيارات).
- **`/l/[slug]?t=[table]`**: بطاقة العميل التفاعلية السريعة (تسجيل أول زيارة، ختم الزيارات بالكوكي المشفرة، وقسيمة الزيارة السادسة الذهبية ذات الساعة الحية).
- **`/q/[code]?t=[table]`**: بوابة التحويل الديناميكي بدون تخزين مؤقت (`HTTP 307` + `Cache-Control: no-store`).
- **`/api/health`**: مسار فحص الجاهزية وإبقاء قاعدة البيانات نشطة (مع ملف `.github/workflows/supabase-keepalive.yml`).
