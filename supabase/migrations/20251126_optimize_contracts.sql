-- 1. Create a View for basic contract summaries (useful for admin dashboards or simple lists)
CREATE OR REPLACE VIEW contracts_summary_view AS
SELECT
  c.id,
  c.name,
  c.file_number,
  c.dossier_number,
  c.start_date,
  c.end_date,
  c.contract_type,
  c.award_procedure,
  c.created_at,
  COALESCE(SUM(cr.credit_committed_d), 0) as total_committed,
  COALESCE(SUM(cr.credit_recognized_o), 0) as total_recognized,
  COALESCE(SUM(cr.credit_real), 0) as total_real
FROM contracts c
LEFT JOIN lots l ON c.id = l.contract_id
LEFT JOIN credits cr ON l.id = cr.lot_id
GROUP BY c.id;

-- 2. Create an RPC function for advanced filtering and pagination
-- This function handles the complex logic of filtering by year, areas, centers, etc. efficiently.
-- Usage: supabase.rpc('get_contracts_summary', { p_search: '...', p_page: 0 ... })

CREATE OR REPLACE FUNCTION get_contracts_summary(
  p_search text DEFAULT NULL,
  p_years integer[] DEFAULT NULL,
  p_page integer DEFAULT 0,
  p_page_size integer DEFAULT 50,
  p_areas uuid[] DEFAULT NULL,
  p_centers uuid[] DEFAULT NULL,
  p_types text[] DEFAULT NULL,
  p_procedures text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  file_number text,
  dossier_number text,
  start_date date,
  end_date date,
  contract_type text,
  total_committed numeric,
  total_recognized numeric,
  total_real numeric,
  full_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset integer;
BEGIN
  v_offset := p_page * p_page_size;

  RETURN QUERY
  WITH filtered_contracts AS (
    SELECT DISTINCT c.id
    FROM contracts c
    LEFT JOIN contract_areas ca ON c.id = ca.contract_id
    LEFT JOIN contract_centers cc ON c.id = cc.contract_id
    WHERE
      (p_search IS NULL OR c.name ILIKE '%' || p_search || '%' OR c.file_number ILIKE '%' || p_search || '%' OR c.dossier_number ILIKE '%' || p_search || '%')
      AND (p_types IS NULL OR c.contract_type = ANY(p_types))
      AND (p_procedures IS NULL OR c.award_procedure = ANY(p_procedures))
      AND (p_areas IS NULL OR ca.area_id = ANY(p_areas))
      AND (p_centers IS NULL OR cc.center_id = ANY(p_centers))
  ),
  contract_financials AS (
    SELECT
      c.id,
      -- Calculate Committed: Sum of credits where credit.any matches selected years (or all if no years selected)
      SUM(CASE 
        WHEN p_years IS NULL THEN cr.credit_committed_d 
        WHEN cr.any = ANY(p_years) THEN cr.credit_committed_d
        ELSE 0 
      END) as committed,
      
      -- Calculate Recognized: Sum of INVOICES where invoice year matches selected years
      -- Note: This overrides the credit.credit_recognized_o field to be precise with invoice dates
      (
        SELECT COALESCE(SUM(i.total), 0)
        FROM invoices i
        JOIN credits cr2 ON i.credit_id = cr2.id
        JOIN lots l2 ON cr2.lot_id = l2.id
        WHERE l2.contract_id = c.id
        AND (p_years IS NULL OR EXTRACT(YEAR FROM i.invoice_date)::integer = ANY(p_years))
      ) as recognized
      
    FROM contracts c
    JOIN lots l ON c.id = l.contract_id
    JOIN credits cr ON l.id = cr.lot_id
    WHERE c.id IN (SELECT id FROM filtered_contracts)
    GROUP BY c.id
  )
  SELECT
    c.id,
    c.name,
    c.file_number,
    c.dossier_number,
    c.start_date,
    c.end_date,
    c.contract_type,
    COALESCE(cf.committed, 0) as total_committed,
    COALESCE(cf.recognized, 0) as total_recognized,
    -- Real = Committed - Recognized
    COALESCE(cf.committed - cf.recognized, 0) as total_real,
    (SELECT COUNT(*) FROM filtered_contracts) as full_count
  FROM contracts c
  JOIN filtered_contracts fc ON c.id = fc.id
  LEFT JOIN contract_financials cf ON c.id = cf.id
  ORDER BY c.created_at DESC
  LIMIT p_page_size OFFSET v_offset;
END;
$$;
