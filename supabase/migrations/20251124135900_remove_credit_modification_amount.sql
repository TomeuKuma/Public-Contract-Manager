-- Remove deprecated modification amount fields
-- These are replaced by the flag-based system where modifications/extensions
-- are represented as separate credit records

ALTER TABLE public.credits DROP COLUMN IF EXISTS modificacio_credit;
ALTER TABLE public.credits DROP COLUMN IF EXISTS percentage_modified;
