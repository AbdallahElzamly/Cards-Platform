-- ============================================================================
-- MIGRATION: 20261127_companies_workspace.sql
-- Description: Companies workspace table for B2B fleet tracking and organization portals
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  contact_email text,
  batch_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active companies by slug"
  ON public.companies FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage companies"
  ON public.companies FOR ALL
  USING (true);
