-- Add columns to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS end_date DATE;

-- Function to calculate dates for a specific contract
CREATE OR REPLACE FUNCTION calculate_contract_dates(contract_uuid UUID)
RETURNS VOID AS $$
DECLARE
    min_start DATE;
    max_end DATE;
BEGIN
    -- Calculate start date (earliest lot start date)
    SELECT MIN(start_date)
    INTO min_start
    FROM lots
    WHERE contract_id = contract_uuid;

    -- Calculate end date (latest of end_date or extension_end_date)
    SELECT MAX(GREATEST(end_date, COALESCE(extension_end_date, end_date)))
    INTO max_end
    FROM lots
    WHERE contract_id = contract_uuid;

    -- Update the contract
    UPDATE contracts
    SET 
        start_date = min_start,
        end_date = max_end
    WHERE id = contract_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to handle lot changes
CREATE OR REPLACE FUNCTION on_lot_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM calculate_contract_dates(OLD.contract_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM calculate_contract_dates(NEW.contract_id);
        -- If contract_id changed (unlikely but possible), update old one too
        IF (OLD.contract_id IS DISTINCT FROM NEW.contract_id) THEN
            PERFORM calculate_contract_dates(OLD.contract_id);
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        PERFORM calculate_contract_dates(NEW.contract_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_contract_dates_trigger ON lots;
CREATE TRIGGER update_contract_dates_trigger
AFTER INSERT OR UPDATE OR DELETE ON lots
FOR EACH ROW
EXECUTE FUNCTION on_lot_change();

-- Backfill existing data
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM contracts LOOP
        PERFORM calculate_contract_dates(r.id);
    END LOOP;
END $$;
