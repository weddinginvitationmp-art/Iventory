-- Migration to update inventory system to transaction-based model
-- Run this in Supabase SQL Editor

-- Update items table structure
ALTER TABLE kv_store_e379089b ADD COLUMN IF NOT EXISTS key_type TEXT;

-- Create transactions table (using existing kv_store for now, but structured)
-- We'll use key prefixes: 'item:' and 'transaction:'

-- For now, we'll continue using kv_store but with better structure
-- Later can migrate to proper PostgreSQL tables

-- Example data structure for transactions:
-- {
--   "id": "uuid",
--   "item_id": "uuid",
--   "date": "2024-01-15",
--   "type": "import", // or "export"
--   "quantity": 100,
--   "unit_price": 10000,
--   "vat": 1000,
--   "total_amount": 101000,
--   "has_invoice": true
-- }