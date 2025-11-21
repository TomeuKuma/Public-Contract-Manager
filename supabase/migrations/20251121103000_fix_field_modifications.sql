-- Ensure 'tipus_necessitat' column exists in contracts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'tipus_necessitat') THEN
        ALTER TABLE contracts ADD COLUMN tipus_necessitat TEXT CHECK (tipus_necessitat IN ('Puntual', 'Recurrent'));
    END IF;
END $$;

-- Ensure 'instructor_technician' column is removed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'instructor_technician') THEN
        ALTER TABLE contracts DROP COLUMN instructor_technician;
    END IF;
END $$;

-- Ensure 'any' column exists in credits table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credits' AND column_name = 'any') THEN
        ALTER TABLE credits ADD COLUMN "any" INTEGER NOT NULL DEFAULT 2024;
    END IF;
END $$;
