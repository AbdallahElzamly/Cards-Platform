-- ============================================================================
-- MIGRATION: 20261125_loyalty_mvp.sql
-- Description: Isolated loyalty tables, indexes, strict RLS policies, and helper functions.
-- ============================================================================

-- 1. loyalty_programs
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  business_name text NOT NULL,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#1E3A8A',
  stamps_required smallint NOT NULL DEFAULT 6 CHECK (stamps_required BETWEEN 3 AND 12),
  min_bill_egp integer NOT NULL DEFAULT 100,
  reward_title text NOT NULL DEFAULT 'وجبتك السادسة مجاناً',
  reward_terms text NOT NULL DEFAULT 'بحد أقصى متوسط طلباتك أو من قائمة المكافآت المختارة',
  cooldown_hours smallint NOT NULL DEFAULT 18 CHECK (cooldown_hours BETWEEN 1 AND 72),
  daily_pin_hash text NOT NULL,
  daily_pin_display text NOT NULL,
  pin_rotated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  v2_scratch_enabled boolean NOT NULL DEFAULT false,
  v2_double_stamp_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. loyalty_members
CREATE TABLE IF NOT EXISTS public.loyalty_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  phone_hash text NOT NULL,
  phone_last4 char(4) NOT NULL,
  current_stamps smallint NOT NULL DEFAULT 0,
  total_visits integer NOT NULL DEFAULT 0,
  total_redemptions integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'standard',
  last_visit_at timestamptz,
  consent_accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT loyalty_members_program_phone_key UNIQUE (program_id, phone_hash)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_members_program_last_visit 
  ON public.loyalty_members(program_id, last_visit_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_members_program_stamps 
  ON public.loyalty_members(program_id, current_stamps);

-- 3. loyalty_visits
CREATE TABLE IF NOT EXISTS public.loyalty_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
  table_code text,
  stamps_awarded smallint NOT NULL DEFAULT 1,
  stamp_number_after smallint NOT NULL,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_visits_member_created 
  ON public.loyalty_visits(member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_visits_program_created 
  ON public.loyalty_visits(program_id, created_at DESC);

-- 4. loyalty_vouchers
CREATE TABLE IF NOT EXISTS public.loyalty_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
  voucher_code text UNIQUE NOT NULL,
  reward_title text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  redeemed_at timestamptz,
  redeemed_by_table text
);

CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_member_status 
  ON public.loyalty_vouchers(member_id, status);

-- 5. loyalty_pin_attempts
CREATE TABLE IF NOT EXISTS public.loyalty_pin_attempts (
  id bigserial PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  actor_key text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_pin_attempts_lookup 
  ON public.loyalty_pin_attempts(program_id, actor_key, attempted_at DESC);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_pin_attempts ENABLE ROW LEVEL SECURITY;

-- loyalty_programs: Owners can manage their programs. No direct anon write/read.
CREATE POLICY "Owners can view own loyalty programs"
  ON public.loyalty_programs FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own loyalty programs"
  ON public.loyalty_programs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own loyalty programs"
  ON public.loyalty_programs FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own loyalty programs"
  ON public.loyalty_programs FOR DELETE
  USING (auth.uid() = owner_id);


-- loyalty_members: Owners can manage members of their programs.
CREATE POLICY "Owners can manage members of their programs"
  ON public.loyalty_members FOR ALL
  USING (
    program_id IN (
      SELECT id FROM public.loyalty_programs WHERE owner_id = auth.uid()
    )
  );


-- loyalty_visits: Owners can view visits of their programs.
CREATE POLICY "Owners can view visits of their programs"
  ON public.loyalty_visits FOR ALL
  USING (
    program_id IN (
      SELECT id FROM public.loyalty_programs WHERE owner_id = auth.uid()
    )
  );


-- loyalty_vouchers: Owners can view/manage vouchers of their programs.
CREATE POLICY "Owners can manage vouchers of their programs"
  ON public.loyalty_vouchers FOR ALL
  USING (
    program_id IN (
      SELECT id FROM public.loyalty_programs WHERE owner_id = auth.uid()
    )
  );


-- loyalty_pin_attempts: Deny all direct client access (accessed via service role).
CREATE POLICY "Deny all client access to pin attempts"
  ON public.loyalty_pin_attempts FOR ALL
  USING (false);


-- ============================================================================
-- ATOMIC REDEMPTION HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.redeem_loyalty_voucher(
  p_voucher_id uuid,
  p_table_code text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  message text,
  member_id uuid,
  program_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_voucher RECORD;
  v_member RECORD;
BEGIN
  -- Lock voucher row
  SELECT * INTO v_voucher 
  FROM public.loyalty_vouchers 
  WHERE id = p_voucher_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'القسيمة غير صالحة أو تم استخدامها مسبقاً', NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  -- Lock member row
  SELECT * INTO v_member
  FROM public.loyalty_members
  WHERE id = v_voucher.member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'العضو غير موجود', NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  -- Mark voucher redeemed
  UPDATE public.loyalty_vouchers
  SET status = 'redeemed',
      redeemed_at = now(),
      redeemed_by_table = p_table_code
  WHERE id = p_voucher_id;

  -- Reset stamps and increment redemptions
  UPDATE public.loyalty_members
  SET current_stamps = 0,
      total_redemptions = total_redemptions + 1
  WHERE id = v_voucher.member_id;

  RETURN QUERY SELECT true, 'تم تسليم الهدية بنجاح', v_voucher.member_id, v_voucher.program_id;
END;
$$;


-- ============================================================================
-- SCHEMA & TABLE GRANTS (Required for Supabase PostgREST roles)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE
  public.loyalty_programs,
  public.loyalty_members,
  public.loyalty_visits,
  public.loyalty_vouchers,
  public.loyalty_pin_attempts
TO postgres, service_role;

GRANT USAGE, SELECT ON SEQUENCE public.loyalty_pin_attempts_id_seq TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.loyalty_programs,
  public.loyalty_members,
  public.loyalty_visits,
  public.loyalty_vouchers
TO authenticated;

GRANT EXECUTE ON FUNCTION public.redeem_loyalty_voucher(uuid, text) TO postgres, service_role, authenticated;


-- ============================================================================
-- COMMENTED-OUT SEED BLOCK (For local testing in Supabase SQL Editor)
-- ============================================================================
/*
-- First, ensure you have a valid user in auth.users, then replace 'YOUR-OWNER-UUID-HERE' with that uuid:
INSERT INTO public.loyalty_programs (
  owner_id,
  slug,
  business_name,
  primary_color,
  stamps_required,
  min_bill_egp,
  reward_title,
  reward_terms,
  cooldown_hours,
  daily_pin_hash,
  daily_pin_display,
  is_active
) VALUES (
  'YOUR-OWNER-UUID-HERE',
  'test-cafe',
  'تيست كافيه (Test Cafe)',
  '#1E3A8A',
  6,
  100,
  'وجبتك السادسة مجاناً',
  'بحد أقصى متوسط طلباتك أو من قائمة المكافآت المختارة',
  18,
  'HASH_OF_1234_WITH_PEPPER',
  '1234',
  true
);
*/
