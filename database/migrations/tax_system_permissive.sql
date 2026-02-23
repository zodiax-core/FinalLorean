-- ALTERNATIVE TAX SYSTEM MIGRATION (More Permissive for Testing)
-- Use this if you're having permission issues with the main migration

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to active tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to read all tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to insert tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to delete tax rules" ON tax_rules;

-- Create more permissive policies for testing
CREATE POLICY "Allow all to read tax rules"
    ON tax_rules FOR SELECT
    USING (true);

CREATE POLICY "Allow all to insert tax rules"
    ON tax_rules FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all to update tax rules"
    ON tax_rules FOR UPDATE
    USING (true);

CREATE POLICY "Allow all to delete tax rules"
    ON tax_rules FOR DELETE
    USING (true);

-- Note: These policies are VERY permissive and should be tightened for production
-- Once you confirm everything works, you can update them to require authentication
