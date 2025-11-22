-- Function to get available years from all relevant tables
CREATE OR REPLACE FUNCTION get_available_years()
RETURNS TABLE (year INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH all_years AS (
        -- Years from Contracts (start_date to end_date)
        SELECT DISTINCT generate_series(EXTRACT(YEAR FROM start_date)::INTEGER, EXTRACT(YEAR FROM end_date)::INTEGER) as y
        FROM contracts
        WHERE start_date IS NOT NULL AND end_date IS NOT NULL
        
        UNION
        
        -- Years from Lots (start_date to end_date or extension_end_date)
        SELECT DISTINCT generate_series(EXTRACT(YEAR FROM start_date)::INTEGER, EXTRACT(YEAR FROM COALESCE(extension_end_date, end_date))::INTEGER) as y
        FROM lots
        WHERE start_date IS NOT NULL AND (end_date IS NOT NULL OR extension_end_date IS NOT NULL)
        
        UNION
        
        -- Years from Credits (any column)
        SELECT DISTINCT "any" as y
        FROM credits
        WHERE "any" IS NOT NULL
        
        UNION
        
        -- Years from Invoices (invoice_date)
        SELECT DISTINCT EXTRACT(YEAR FROM invoice_date)::INTEGER as y
        FROM invoices
        WHERE invoice_date IS NOT NULL
    )
    SELECT DISTINCT y as year
    FROM all_years
    ORDER BY year DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_years() TO postgres, anon, authenticated, service_role;
