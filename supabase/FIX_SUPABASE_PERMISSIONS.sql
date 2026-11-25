-- ============================================================================
-- FIX_SUPABASE_PERMISSIONS.sql
-- شغّل هذا الملف مرة واحدة داخل Supabase Dashboard -> SQL Editor -> Run
-- يحل مشكلة (42501: permission denied for table loyalty_programs) وصلاحيات الأدوار
-- ============================================================================

-- 1. منح صلاحية استخدام الـ Schema للأدوار الأساسية في Supabase
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. منح الصلاحيات الكاملة لدور السيرفر (service_role) على جميع الجداول والـ Sequences والدوال
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 3. منح صلاحيات التاجر المسجل (authenticated) خاضعة لسياسات RLS المفعلة
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_visits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_vouchers TO authenticated;

-- 4. تثبيت الصلاحيات الافتراضية لأي جداول مستقبلية في public
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, service_role;

-- 5. معالجة حقول النصوص الفارغة (NULL) في auth.users إن وجدت (تمنع خطأ Database error finding users)
DO $$
BEGIN
  UPDATE auth.users
  SET
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, '')
  WHERE
    confirmation_token IS NULL
    OR recovery_token IS NULL
    OR email_change_token_new IS NULL
    OR email_change IS NULL;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping auth.users cleanup (insufficient privilege, safe to ignore if no manual users were inserted).';
END $$;
