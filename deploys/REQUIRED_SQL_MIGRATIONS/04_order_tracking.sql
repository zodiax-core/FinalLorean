-- 📦 Order Tracking & Short ID System
-- This migration adds the short_id system for better order searchability and tracking.

-- 1. Add short_id column if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE;

-- 2. Create function to generate short IDs
CREATE OR REPLACE FUNCTION generate_short_order_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_id IS NULL THEN
    NEW.short_id := 'LRN-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger
DROP TRIGGER IF EXISTS tr_generate_short_order_id ON orders;
CREATE TRIGGER tr_generate_short_order_id
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_short_order_id();

-- 4. Retroactive update for existing orders (Optional but recommended)
UPDATE orders 
SET short_id = 'LRN-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6)) 
WHERE short_id IS NULL;
