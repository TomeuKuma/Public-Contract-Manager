-- 1. BASE SCHEMA (Updated with latest fields)
-- Create enum for contract types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 1. AREAS TABLE
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. CENTERS TABLE
CREATE TABLE public.centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(area_id, name)
);

-- 3. CONTRACTS TABLE
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dossier_number TEXT,
  file_number TEXT,
  -- instructor_technician removed
  tipus_necessitat TEXT CHECK (tipus_necessitat IN ('Puntual', 'Recurrent')), -- Added
  contracting_body TEXT,
  contact_responsible TEXT,
  award_procedure TEXT,
  contract_type TEXT,
  purpose TEXT,
  extendable BOOLEAN DEFAULT false,
  modifiable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. CONTRACT_AREAS (many-to-many)
CREATE TABLE public.contract_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(contract_id, area_id)
);

-- 5. CONTRACT_CENTERS (many-to-many)
CREATE TABLE public.contract_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(contract_id, center_id)
);

-- 6. LOTS TABLE
CREATE TABLE public.lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cpv TEXT,
  awardee TEXT,
  cif_nif TEXT,
  observations TEXT,
  start_date DATE,
  end_date DATE,
  extension_communication_deadline DATE,
  extension_start_date DATE,
  extension_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. CREDITS TABLE
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE NOT NULL,
  organic_item TEXT,
  program_item TEXT,
  economic_item TEXT,
  accounting_document_number TEXT,
  credit_committed_d NUMERIC(12,2) DEFAULT 0 NOT NULL,
  credit_recognized_o NUMERIC(12,2) DEFAULT 0 NOT NULL,
  credit_real NUMERIC(12,2) DEFAULT 0 NOT NULL,
  percentage_modified INTEGER DEFAULT 0,
  modificacio_credit NUMERIC(10,2) DEFAULT 0, -- Added from migration
  "any" INTEGER NOT NULL DEFAULT 2024, -- Added
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 8. INVOICES TABLE
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID REFERENCES public.credits(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  base_amount NUMERIC(12,2) NOT NULL,
  vat_amount NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for optimization
-- idx_contracts_instructor removed
CREATE INDEX idx_contracts_contract_type ON public.contracts(contract_type);
CREATE INDEX idx_lots_contract_id ON public.lots(contract_id);
CREATE INDEX idx_credits_lot_id ON public.credits(lot_id);
CREATE INDEX idx_invoices_credit_id ON public.invoices(credit_id);
CREATE INDEX idx_contract_areas_contract_id ON public.contract_areas(contract_id);
CREATE INDEX idx_contract_areas_area_id ON public.contract_areas(area_id);
CREATE INDEX idx_contract_centers_contract_id ON public.contract_centers(contract_id);
CREATE INDEX idx_contract_centers_center_id ON public.contract_centers(center_id);
CREATE INDEX idx_centers_area_id ON public.centers(area_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_centers_updated_at BEFORE UPDATE ON public.centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON public.lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON public.credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate invoice total
CREATE OR REPLACE FUNCTION public.calculate_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total = NEW.base_amount + NEW.vat_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for invoice total calculation
CREATE TRIGGER calculate_invoice_total_trigger
  BEFORE INSERT OR UPDATE OF base_amount, vat_amount ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_total();

-- Function to update credit recognized amount
CREATE OR REPLACE FUNCTION public.update_credit_recognized()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.credits
  SET credit_recognized_o = (
    SELECT COALESCE(SUM(total), 0)
    FROM public.invoices
    WHERE credit_id = COALESCE(NEW.credit_id, OLD.credit_id)
  ),
  credit_real = credit_committed_d - (
    SELECT COALESCE(SUM(total), 0)
    FROM public.invoices
    WHERE credit_id = COALESCE(NEW.credit_id, OLD.credit_id)
  )
  WHERE id = COALESCE(NEW.credit_id, OLD.credit_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for credit calculations
CREATE TRIGGER update_credit_on_invoice_change
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_credit_recognized();

-- Function to update credit_real when credit_committed_d changes
CREATE OR REPLACE FUNCTION public.update_credit_real()
RETURNS TRIGGER AS $$
BEGIN
  NEW.credit_real = NEW.credit_committed_d - NEW.credit_recognized_o;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for credit_real calculation
CREATE TRIGGER calculate_credit_real_trigger
  BEFORE INSERT OR UPDATE OF credit_committed_d, credit_recognized_o ON public.credits
  FOR EACH ROW EXECUTE FUNCTION public.update_credit_real();

-- Enable Row Level Security
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated" ON public.areas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.centers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.contract_areas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.contract_centers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.lots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.credits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data: Areas
INSERT INTO public.areas (name) VALUES 
  ('Atenció Sociosanitària'),
  ('Atenció Comunitaria i Promoció de la Autonomia Personal');

-- Seed data: Centers for "Atenció Sociosanitària"
INSERT INTO public.centers (area_id, name)
SELECT id, center_name FROM public.areas, (VALUES
  ('Residència Llar dels Ancians'),
  ('Residència La Bonanova'),
  ('Residència Bartomeu Quetglas'),
  ('Residència Huialfàs'),
  ('Residència Oms-Sant Miquel'),
  ('Residència Miquel Mir'),
  ('Residència Sant Josep'),
  ('Residència Son Caulelles'),
  ('Centre de dia Reina Sofia'),
  ('Centre de dia Can Clar'),
  ('Centre de dia Son Perxana'),
  ('Servei d''Atenció Sociosanitària')
) AS centers(center_name)
WHERE areas.name = 'Atenció Sociosanitària';

-- Seed data: Centers for "Atenció Comunitaria i Promoció de la Autonomia Personal"
INSERT INTO public.centers (area_id, name)
SELECT id, center_name FROM public.areas, (VALUES
  ('CPAP Llar d''Avinguda Argentina'),
  ('CPAP Llar de Llucmajor'),
  ('CPAP Llar de Manacor'),
  ('CPAP Llar de Felanitx'),
  ('CPAP Llar Reina Sofia'),
  ('CPAP Son Bru (Puigpunyent)'),
  ('CPAP Can Real (Petra)'),
  ('Servei d''Ajuda Integral a Domicili'),
  ('Oficina d''habitatge (Inca)')
) AS centers(center_name)
WHERE areas.name = 'Atenció Comunitaria i Promoció de la Autonomia Personal';


-- FIXES (Security & Functions)
-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update calculate_invoice_total function
CREATE OR REPLACE FUNCTION public.calculate_invoice_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.total = NEW.base_amount + NEW.vat_amount;
  RETURN NEW;
END;
$$;

-- Update update_credit_recognized function
CREATE OR REPLACE FUNCTION public.update_credit_recognized()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.credits
  SET credit_recognized_o = (
    SELECT COALESCE(SUM(total), 0)
    FROM public.invoices
    WHERE credit_id = COALESCE(NEW.credit_id, OLD.credit_id)
  ),
  credit_real = credit_committed_d - (
    SELECT COALESCE(SUM(total), 0)
    FROM public.invoices
    WHERE credit_id = COALESCE(NEW.credit_id, OLD.credit_id)
  )
  WHERE id = COALESCE(NEW.credit_id, OLD.credit_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update update_credit_real function
CREATE OR REPLACE FUNCTION public.update_credit_real()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.credit_real = NEW.credit_committed_d - NEW.credit_recognized_o;
  RETURN NEW;
END;
$$;
