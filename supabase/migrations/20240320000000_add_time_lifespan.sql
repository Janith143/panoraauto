-- Update vehicle_parts to track time-based lifespans
ALTER TABLE vehicle_parts
ADD COLUMN IF NOT EXISTS last_service_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS lifespan_months INTEGER;

-- Ensure existing parts have a valid last_service_date (could be created_at if we had it, but NOW() is safe fallback for new col)
UPDATE vehicle_parts SET last_service_date = NOW() WHERE last_service_date IS NULL;

-- 2. Update service_items to allow time-based lifespans on invoices
ALTER TABLE service_items
ADD COLUMN IF NOT EXISTS lifespan_months INTEGER;
