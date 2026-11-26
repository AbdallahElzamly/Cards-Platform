-- ============================================================================
-- MIGRATION: 20261127_add_phone_raw_for_merchant.sql
-- Description: Store readable normalized Egyptian phone in loyalty_members
--              for merchant customer retention, marketing calls, and WhatsApp promotions.
-- ============================================================================

-- 1. Add phone column to loyalty_members
ALTER TABLE public.loyalty_members 
ADD COLUMN IF NOT EXISTS phone text;

-- 2. Add an index on phone for fast lookup
CREATE INDEX IF NOT EXISTS idx_loyalty_members_phone 
ON public.loyalty_members(phone);

-- 3. Ensure permissions for service_role and authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.loyalty_members TO service_role, authenticated;
