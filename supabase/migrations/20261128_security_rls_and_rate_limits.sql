-- ============================================================================
-- MIGRATION: 20261128_security_rls_and_rate_limits.sql
-- Description: Lock down direct PostgREST access on companies, cards,
--              business_cards, card_leads, and scans; add distributed
--              rate_limit_events table for leads & scans anti-spam.
-- ============================================================================

-- 1. public.companies: lock down to authenticated managers & service_role only
DROP POLICY IF EXISTS "Public can view active companies by slug" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Company managers can view own company" ON public.companies;

REVOKE INSERT, UPDATE, DELETE ON public.companies FROM anon, authenticated;

CREATE POLICY "Company managers can view own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    contact_email IS NOT NULL
    AND lower(contact_email) = lower(auth.jwt() ->> 'email')
  );

-- 2. public.cards: prevent anon/authenticated read or hijack of unowned cards (owner_id IS NULL)
DROP POLICY IF EXISTS "Public can view active cards by code" ON public.cards;
DROP POLICY IF EXISTS "Owners can manage own cards" ON public.cards;
DROP POLICY IF EXISTS "Admins or service role can insert/manage cards" ON public.cards;
DROP POLICY IF EXISTS "Owners can update own cards" ON public.cards;
DROP POLICY IF EXISTS "Owners can view own cards" ON public.cards;
DROP POLICY IF EXISTS "Owners can update own active cards" ON public.cards;

REVOKE INSERT, DELETE ON public.cards FROM anon, authenticated;
REVOKE UPDATE ON public.cards FROM anon;

CREATE POLICY "Owners can view own cards"
  ON public.cards FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id AND owner_id IS NOT NULL);

CREATE POLICY "Owners can update own active cards"
  ON public.cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id AND owner_id IS NOT NULL)
  WITH CHECK (auth.uid() = owner_id AND owner_id IS NOT NULL);

-- 3. public.business_cards: only owners can update their own active cards; inserts via service_role
DROP POLICY IF EXISTS "Public can view active business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Owners can manage own business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Public can insert business cards during activation" ON public.business_cards;
DROP POLICY IF EXISTS "Owners can update own business cards" ON public.business_cards;

REVOKE INSERT, DELETE ON public.business_cards FROM anon, authenticated;
REVOKE UPDATE ON public.business_cards FROM anon;

CREATE POLICY "Public can view active business cards"
  ON public.business_cards FOR SELECT
  USING (
    is_active = true
    OR card_id IN (
      SELECT id FROM public.cards
      WHERE owner_id = auth.uid() AND owner_id IS NOT NULL
    )
  );

CREATE POLICY "Owners can update own business cards"
  ON public.business_cards FOR UPDATE
  TO authenticated
  USING (
    card_id IN (
      SELECT id FROM public.cards
      WHERE owner_id = auth.uid() AND owner_id IS NOT NULL
    )
  )
  WITH CHECK (
    card_id IN (
      SELECT id FROM public.cards
      WHERE owner_id = auth.uid() AND owner_id IS NOT NULL
    )
  );

-- 4. public.card_leads: force inserts through hardened server action (service_role)
DROP POLICY IF EXISTS "Public can insert leads into active business cards" ON public.card_leads;

REVOKE INSERT, UPDATE ON public.card_leads FROM anon, authenticated;

-- 5. public.scans: force inserts through hardened server-side scan logger (service_role)
DROP POLICY IF EXISTS "Public can insert scan analytics" ON public.scans;

REVOKE INSERT, UPDATE, DELETE ON public.scans FROM anon, authenticated;

-- 6. public.rate_limit_events: serverless/Workers-safe distributed rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id bigserial PRIMARY KEY,
  scope text NOT NULL,
  actor_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup
  ON public.rate_limit_events(scope, actor_key, created_at DESC);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all client access to rate limit events" ON public.rate_limit_events;
CREATE POLICY "Deny all client access to rate limit events"
  ON public.rate_limit_events FOR ALL
  USING (false);

REVOKE ALL ON TABLE public.rate_limit_events FROM anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.rate_limit_events TO postgres, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.rate_limit_events_id_seq TO postgres, service_role;

-- 7. Ensure service_role & postgres retain full access across core smart-card tables
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE
  public.companies,
  public.cards,
  public.business_cards,
  public.card_leads,
  public.scans
TO postgres, service_role;
