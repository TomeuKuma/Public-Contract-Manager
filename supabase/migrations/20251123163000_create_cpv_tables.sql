-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create CPV Codes Table
CREATE TABLE IF NOT EXISTS cpv_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(11) NOT NULL UNIQUE,          -- Full code: 12345678-9
  code_numeric VARCHAR(8) NOT NULL,          -- Numeric part: 12345678
  check_digit CHAR(1) NOT NULL,              -- Verification digit: 9
  description_es TEXT NOT NULL,              -- Spanish description
  description_ca TEXT NOT NULL,              -- Catalan description (PRIMARY)
  contract_type VARCHAR(50) NOT NULL,        -- Subministraments, Serveis, Obra, Concessió
  
  -- Hierarchical fields extracted from code
  division VARCHAR(2) NOT NULL,              -- XX from XX000000
  group_code VARCHAR(3) NOT NULL,            -- XXX from XXX00000
  class_code VARCHAR(4) NOT NULL,            -- XXXX from XXXX0000
  category_code VARCHAR(5) NOT NULL,         -- XXXXX from XXXXX000
  
  -- Depth level: 1=division, 2=group, 3=class, 4=category, 5=full element
  depth_level INTEGER NOT NULL,
  
  -- Full-text search (Catalan + Spanish)
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('catalan', description_ca) || 
    to_tsvector('spanish', description_es)
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for CPV Codes
CREATE INDEX IF NOT EXISTS idx_cpv_code ON cpv_codes(code);
CREATE INDEX IF NOT EXISTS idx_cpv_numeric ON cpv_codes(code_numeric);
CREATE INDEX IF NOT EXISTS idx_cpv_division ON cpv_codes(division);
CREATE INDEX IF NOT EXISTS idx_cpv_group ON cpv_codes(group_code);
CREATE INDEX IF NOT EXISTS idx_cpv_class ON cpv_codes(class_code);
CREATE INDEX IF NOT EXISTS idx_cpv_category ON cpv_codes(category_code);
CREATE INDEX IF NOT EXISTS idx_cpv_depth ON cpv_codes(depth_level);
CREATE INDEX IF NOT EXISTS idx_cpv_contract_type ON cpv_codes(contract_type);
CREATE INDEX IF NOT EXISTS idx_cpv_search ON cpv_codes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_cpv_hierarchy ON cpv_codes(division, group_code, class_code, category_code);

-- 2. Create Helper Function to calculate depth
CREATE OR REPLACE FUNCTION calculate_cpv_depth(code_num VARCHAR(8))
RETURNS INTEGER AS $$
BEGIN
  IF SUBSTRING(code_num, 3, 6) = '000000' THEN RETURN 1;  -- Division
  ELSIF SUBSTRING(code_num, 4, 5) = '00000' THEN RETURN 2;  -- Group
  ELSIF SUBSTRING(code_num, 5, 4) = '0000' THEN RETURN 3;   -- Class
  ELSIF SUBSTRING(code_num, 6, 3) = '000' THEN RETURN 4;    -- Category
  ELSE RETURN 5;  -- Full element
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Update Lots Table
-- Add new column
ALTER TABLE lots ADD COLUMN IF NOT EXISTS cpv_code_id UUID REFERENCES cpv_codes(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_lots_cpv ON lots(cpv_code_id);

-- Note: We are NOT dropping the old 'cpv' column yet to allow for migration.
-- The migration of data will be handled separately or manually if needed, 
-- as we don't have the CPV data populated yet to link it.

-- 4. Create View for Easy Queries
CREATE OR REPLACE VIEW lots_with_cpv AS
SELECT 
  l.*,
  c.code AS cpv_code,
  c.description_ca AS cpv_description,
  c.contract_type AS cpv_contract_type,
  c.depth_level AS cpv_depth
FROM lots l
LEFT JOIN cpv_codes c ON l.cpv_code_id = c.id;
