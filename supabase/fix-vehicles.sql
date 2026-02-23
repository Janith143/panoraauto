-- Run this to patch the vehicles table with the missing columns.
-- The previous script skipped these because the table already existed!

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS current_odo INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS revenue_license_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS photos TEXT[];
