-- Admin Permissions Fix for Products Table
-- Run this in Supabase SQL Editor to ensure the admin can manage products

-- 1. Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Allow public read access" ON products;

-- 3. Public Read Access
CREATE POLICY "Allow public read access" ON products
    FOR SELECT USING (true);

-- 4. Admin Write Access (Email Based)
CREATE POLICY "Admins can insert products" ON products
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = 'zodiaxcore@gmail.com'
    );

CREATE POLICY "Admins can update products" ON products
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'zodiaxcore@gmail.com'
    );

CREATE POLICY "Admins can delete products" ON products
    FOR DELETE USING (
        auth.jwt() ->> 'email' = 'zodiaxcore@gmail.com'
    );
