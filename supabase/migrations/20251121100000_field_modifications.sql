-- Add 'any' column to credits table
ALTER TABLE credits ADD COLUMN "any" INTEGER NOT NULL DEFAULT 2024;

-- Add 'tipus_necessitat' column to contracts table
ALTER TABLE contracts ADD COLUMN tipus_necessitat TEXT CHECK (tipus_necessitat IN ('Puntual', 'Recurrent'));

-- Remove 'instructor_technician' column from contracts table
ALTER TABLE contracts DROP COLUMN instructor_technician;
