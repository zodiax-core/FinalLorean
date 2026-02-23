# 🚀 Quick Setup Guide - Tax System Migration

## Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your **Lorean** project

## Step 2: Run the SQL Migration

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Copy the **entire contents** of this file:
   ```
   database/migrations/tax_system.sql
   ```
4. Paste it into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for "Success" message

### Option B: Copy-Paste from Below

If you can't access the file, copy this SQL and run it in Supabase SQL Editor:

```sql
-- Tax Rules Table
CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_name TEXT NOT NULL,
    tax_type TEXT NOT NULL CHECK (tax_type IN ('percentage', 'fixed')),
    tax_rate DECIMAL(10, 2) NOT NULL,
    country TEXT NOT NULL DEFAULT 'GLOBAL',
    region TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    product_overrides JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add tax fields to orders table (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_breakdown JSONB DEFAULT '[]';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tax_rules_country ON tax_rules(country);
CREATE INDEX IF NOT EXISTS idx_tax_rules_active ON tax_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_tax_rules_priority ON tax_rules(priority);

-- Enable RLS
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_rules
CREATE POLICY "Allow public read access to active tax rules"
    ON tax_rules FOR SELECT
    USING (is_active = true);

CREATE POLICY "Allow authenticated users to read all tax rules"
    ON tax_rules FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert tax rules"
    ON tax_rules FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update tax rules"
    ON tax_rules FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to delete tax rules"
    ON tax_rules FOR DELETE
    TO authenticated
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tax_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER tax_rules_updated_at
    BEFORE UPDATE ON tax_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_tax_rules_updated_at();

-- Insert some default tax rules
INSERT INTO tax_rules (tax_name, tax_type, tax_rate, country, is_active, priority) VALUES
('VAT', 'percentage', 20.00, 'GB', true, 1),
('GST', 'percentage', 18.00, 'IN', true, 1),
('Sales Tax', 'percentage', 7.00, 'US', true, 1),
('HST', 'percentage', 13.00, 'CA', true, 1),
('GST', 'percentage', 10.00, 'AU', true, 1)
ON CONFLICT DO NOTHING;
```

## Step 3: Verify the Migration

After running the SQL, verify it worked:

1. In Supabase, go to **"Table Editor"**
2. You should see a new table called **`tax_rules`**
3. Click on it - you should see 5 default tax rules (VAT, GST, etc.)
4. Check the **`orders`** table - it should now have `tax_amount` and `tax_breakdown` columns

## Step 4: Test the Admin Page

1. Go to your app: `http://localhost:5173/admin/taxes`
2. You should see:
   - ✅ 5 Total Rules
   - ✅ 5 Active Rules
   - ✅ Tax rules table with UK VAT, India GST, etc.

## Troubleshooting

### Error: "relation 'orders' does not exist"
- The orders table hasn't been created yet
- Comment out lines 16-19 in the SQL (the ALTER TABLE part)
- Run the rest of the migration
- You can add those columns later when orders table exists

### Error: "Failed to load tax archives"
- Make sure you're logged in to the app
- Check browser console for detailed error
- Verify RLS policies are enabled

### Still Not Working?
1. Check Supabase logs in the dashboard
2. Verify your `.env` file has correct Supabase credentials
3. Make sure you're using the correct project

## What This Migration Does

✅ Creates `tax_rules` table with all fields
✅ Adds tax columns to `orders` table
✅ Sets up indexes for fast queries
✅ Enables Row Level Security (RLS)
✅ Creates security policies
✅ Adds auto-update trigger
✅ Inserts 5 default tax rules for major countries

## Default Tax Rules Created

- 🇬🇧 **UK**: VAT 20%
- 🇮🇳 **India**: GST 18%
- 🇺🇸 **USA**: Sales Tax 7%
- 🇨🇦 **Canada**: HST 13%
- 🇦🇺 **Australia**: GST 10%

---

After completing these steps, refresh your admin page and the tax system should work perfectly! 🌿✨
