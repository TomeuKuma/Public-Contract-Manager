-- Add boolean fields for credit modification and extension tracking
-- This replaces the old modificacio_credit amount field with a flag-based system

ALTER TABLE public.credits ADD COLUMN IF NOT EXISTS modificacio BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.credits ADD COLUMN IF NOT EXISTS prorroga BOOLEAN DEFAULT false NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.credits.modificacio IS 'Indicates if this credit is a modification of the original contract';
COMMENT ON COLUMN public.credits.prorroga IS 'Indicates if this credit is an extension of the original contract';
