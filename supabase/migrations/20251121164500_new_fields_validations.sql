-- Add email_adjudicatari to lots
ALTER TABLE lots ADD COLUMN IF NOT EXISTS email_adjudicatari TEXT;

-- Add referencia_interna to contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS referencia_interna TEXT;

-- Add unique constraint to file_number in contracts
ALTER TABLE contracts ADD CONSTRAINT contracts_file_number_key UNIQUE (file_number);

-- Add projecte_inversio and codi_projecte_inversio to credits
ALTER TABLE credits ADD COLUMN IF NOT EXISTS projecte_inversio BOOLEAN DEFAULT false;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS codi_projecte_inversio TEXT;

-- Add center_id to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES centers(id);
