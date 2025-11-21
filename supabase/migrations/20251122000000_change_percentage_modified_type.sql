-- Change percentage_modified column type from INTEGER to NUMERIC(10,2)
ALTER TABLE credits ALTER COLUMN percentage_modified TYPE NUMERIC(10,2);
