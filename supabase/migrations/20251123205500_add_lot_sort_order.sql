-- Add sort_order column to lots table
ALTER TABLE public.lots ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Initialize sort_order for existing lots based on created_at
WITH numbered_lots AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY contract_id ORDER BY created_at ASC) - 1 as new_order
  FROM public.lots
)
UPDATE public.lots
SET sort_order = numbered_lots.new_order
FROM numbered_lots
WHERE public.lots.id = numbered_lots.id;
