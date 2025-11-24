-- Add Row Level Security policy for cpv_codes table
-- This fixes the issue where queries joining with cpv_codes fail because
-- RLS is enabled but no policy is defined

-- Enable RLS on cpv_codes table (if not already enabled)
ALTER TABLE public.cpv_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- This matches the pattern used for other tables in the schema
CREATE POLICY "Allow all for authenticated" ON public.cpv_codes 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);
