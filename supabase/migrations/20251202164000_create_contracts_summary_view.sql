CREATE OR REPLACE VIEW contracts_summary AS
WITH contract_years AS (
  SELECT DISTINCT
    l.contract_id,
    c.any as year
  FROM lots l
  JOIN credits c ON c.lot_id = l.id
  UNION
  SELECT DISTINCT
    l.contract_id,
    EXTRACT(YEAR FROM i.invoice_date)::integer as year
  FROM lots l
  JOIN credits c ON c.lot_id = l.id
  JOIN invoices i ON i.credit_id = c.id
),
contract_years_agg AS (
  SELECT
    contract_id,
    array_agg(DISTINCT year) as years
  FROM contract_years
  GROUP BY contract_id
),
contract_totals AS (
  SELECT
    l.contract_id,
    COALESCE(SUM(c.credit_committed_d), 0) as total_committed,
    COALESCE(SUM(c.credit_recognized_o), 0) as total_recognized,
    COALESCE(SUM(c.credit_committed_d - c.credit_recognized_o), 0) as total_real
  FROM lots l
  LEFT JOIN credits c ON c.lot_id = l.id
  GROUP BY l.contract_id
),
contract_areas_agg AS (
  SELECT
    ca.contract_id,
    array_agg(a.name) as areas_names
  FROM contract_areas ca
  JOIN areas a ON a.id = ca.area_id
  GROUP BY ca.contract_id
),
contract_centers_agg AS (
  SELECT
    cc.contract_id,
    array_agg(c.name) as centers_names
  FROM contract_centers cc
  JOIN centers c ON c.id = cc.center_id
  GROUP BY cc.contract_id
)
SELECT
  c.*,
  COALESCE(ct.total_committed, 0) as total_committed,
  COALESCE(ct.total_recognized, 0) as total_recognized,
  COALESCE(ct.total_real, 0) as total_real,
  CASE 
    WHEN COALESCE(ct.total_committed, 0) = 0 THEN 0
    ELSE (COALESCE(ct.total_recognized, 0) / ct.total_committed) * 100
  END as execution_percentage,
  COALESCE(cy.years, ARRAY[]::integer[]) as years,
  COALESCE(ca.areas_names, ARRAY[]::text[]) as areas_names,
  COALESCE(cc.centers_names, ARRAY[]::text[]) as centers_names
FROM contracts c
LEFT JOIN contract_totals ct ON ct.contract_id = c.id
LEFT JOIN contract_years_agg cy ON cy.contract_id = c.id
LEFT JOIN contract_areas_agg ca ON ca.contract_id = c.id
LEFT JOIN contract_centers_agg cc ON cc.contract_id = c.id;

-- Grant access to authenticated users
GRANT SELECT ON contracts_summary TO authenticated;
