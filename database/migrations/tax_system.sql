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
