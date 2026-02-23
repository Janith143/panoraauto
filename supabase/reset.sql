-- ==========================================
-- AUTO-LOG & GARAGE CONNECT: RESET SCRIPT
-- ==========================================
-- WARNING: This will perfectly WIPE all data and tables in the database.
-- Do not run this in a production environment!

DROP TABLE IF EXISTS vehicle_parts CASCADE;
DROP TABLE IF EXISTS service_items CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS garage_customers CASCADE;
DROP TABLE IF EXISTS garages CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS owners CASCADE;

-- Note: After running this script, you MUST run the `schema.sql` script
-- to rebuild the empty tables!
