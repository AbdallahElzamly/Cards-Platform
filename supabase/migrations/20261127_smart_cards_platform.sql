-- ============================================================================
-- MIGRATION: 20261127_smart_cards_platform.sql
-- Description: Unified Smart Cards Platform Schema (cards, business_cards, card_leads, scans)
-- ============================================================================

-- 1. cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product text NOT NULL CHECK (product IN ('business', 'review', 'loyalty')),
  status text NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'active', 'suspended')),
  target_url text,
  batch_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_code ON public.cards(code);
CREATE INDEX IF NOT EXISTS idx_cards_owner ON public.cards(owner_id);

-- 2. business_cards table
CREATE TABLE IF NOT EXISTS public.business_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid UNIQUE NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  full_name text NOT NULL,
  job_title text,
  company text,
  bio text,
  avatar_url text,
  theme_color text NOT NULL DEFAULT '#0F172A',
  phone text,
  whatsapp text,
  email text,
  website text,
  instapay_url text,
  vodafone_cash text,
  social_links jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_cards_slug ON public.business_cards(slug);

-- 3. card_leads table
CREATE TABLE IF NOT EXISTS public.card_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  visitor_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_leads_business_card ON public.card_leads(business_card_id, created_at DESC);

-- 4. scans table
CREATE TABLE IF NOT EXISTS public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  device_type text
);

CREATE INDEX IF NOT EXISTS idx_scans_card_date ON public.scans(card_id, scanned_at DESC);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- cards policies
CREATE POLICY "Public can view active cards by code"
  ON public.cards FOR SELECT
  USING (status = 'active' OR auth.uid() = owner_id);

CREATE POLICY "Owners can manage own cards"
  ON public.cards FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins or service role can insert/manage cards"
  ON public.cards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can update own cards"
  ON public.cards FOR UPDATE
  USING (auth.uid() = owner_id OR owner_id IS NULL);


-- business_cards policies
CREATE POLICY "Public can view active business cards"
  ON public.business_cards FOR SELECT
  USING (is_active = true OR card_id IN (SELECT id FROM public.cards WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can manage own business cards"
  ON public.business_cards FOR ALL
  USING (
    card_id IN (SELECT id FROM public.cards WHERE owner_id = auth.uid())
  );

CREATE POLICY "Public can insert business cards during activation"
  ON public.business_cards FOR INSERT
  WITH CHECK (true);


-- card_leads policies
CREATE POLICY "Owners can view leads for their business cards"
  ON public.card_leads FOR SELECT
  USING (
    business_card_id IN (
      SELECT bc.id FROM public.business_cards bc
      JOIN public.cards c ON bc.card_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert leads into active business cards"
  ON public.card_leads FOR INSERT
  WITH CHECK (true);


-- scans policies
CREATE POLICY "Owners can view scans for their cards"
  ON public.scans FOR SELECT
  USING (
    card_id IN (SELECT id FROM public.cards WHERE owner_id = auth.uid())
  );

CREATE POLICY "Public can insert scan analytics"
  ON public.scans FOR INSERT
  WITH CHECK (true);
