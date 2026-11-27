-- ============================================================================
-- MIGRATION: 20261127_cards_lost_mode.sql
-- Description: Add 'lost' status support to cards and geo columns to scans
-- ============================================================================

ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_status_check;
ALTER TABLE public.cards ADD CONSTRAINT cards_status_check CHECK (status IN ('unclaimed', 'active', 'suspended', 'lost'));

ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS country text;
