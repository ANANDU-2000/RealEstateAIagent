-- M1: Property status + land type
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS land_type VARCHAR(30);

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_status_check'
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT properties_status_check
      CHECK (status IN ('available', 'sold', 'hidden', 'rented'));
  END IF;
END $$;
