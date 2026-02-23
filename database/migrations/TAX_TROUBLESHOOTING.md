# 🔧 Tax System Troubleshooting Guide

## Error: "Couldn't manifest/add tax rule"

This error typically occurs due to one of these issues:

### 1. **RLS (Row Level Security) Permission Issue** ⚠️ MOST COMMON

**Symptoms:**
- Can view existing tax rules
- Cannot create new rules
- Error message: "Could not manifest tax rule"

**Solution:**
Run the permissive RLS policies in Supabase:

1. Open Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public read access to active tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to read all tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to insert tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to delete tax rules" ON tax_rules;

-- Create permissive policies
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
```

3. Try creating a tax rule again

**Alternative File:**
- Use: `database/migrations/tax_system_permissive.sql`

---

### 2. **Not Logged In**

**Symptoms:**
- Can't create, edit, or delete rules
- May see "Authentication required" errors

**Solution:**
1. Make sure you're logged in to the admin panel
2. Check browser console for auth errors
3. Try logging out and back in

---

### 3. **Missing Table or Columns**

**Symptoms:**
- Error mentions "relation does not exist"
- Error mentions "column does not exist"

**Solution:**
1. Verify the `tax_rules` table exists:
   - Supabase Dashboard → Table Editor
   - Look for `tax_rules` table
2. If missing, run the main migration: `database/migrations/tax_system.sql`

---

### 4. **Invalid Data**

**Symptoms:**
- Error mentions "violates check constraint"
- Error mentions "null value"

**Solution:**
Check your form data:
- ✅ Tax Name: Must not be empty
- ✅ Tax Rate: Must be greater than 0
- ✅ Tax Type: Must be "percentage" or "fixed"
- ✅ Country: Must be valid country code

---

### 5. **Browser Console Errors**

**How to Check:**
1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Try creating a tax rule
4. Look for red error messages

**Common Errors:**

#### Error: "new row violates row-level security policy"
→ **Fix:** Run the permissive RLS policies (see #1 above)

#### Error: "permission denied for table tax_rules"
→ **Fix:** Check Supabase authentication and RLS policies

#### Error: "null value in column violates not-null constraint"
→ **Fix:** Ensure all required fields are filled

---

## Step-by-Step Debugging

### Step 1: Check Browser Console
1. Press F12 to open DevTools
2. Go to Console tab
3. Try adding a tax rule
4. Copy any error messages

### Step 2: Check Network Tab
1. In DevTools, go to Network tab
2. Try adding a tax rule
3. Look for failed requests (red)
4. Click on the failed request
5. Check "Response" tab for error details

### Step 3: Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Filter by "Postgres Logs"
4. Look for recent errors

### Step 4: Verify Table Structure
Run this in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'tax_rules';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tax_rules';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'tax_rules';
```

---

## Quick Fixes

### Fix #1: Reset RLS Policies (Recommended)
```sql
-- Run in Supabase SQL Editor
DROP POLICY IF EXISTS "Allow public read access to active tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to read all tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to insert tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow authenticated users to delete tax rules" ON tax_rules;

CREATE POLICY "Allow all operations" ON tax_rules USING (true) WITH CHECK (true);
```

### Fix #2: Disable RLS Temporarily (Testing Only)
```sql
-- CAUTION: Only for testing!
ALTER TABLE tax_rules DISABLE ROW LEVEL SECURITY;
```

### Fix #3: Re-enable RLS with Proper Policies
```sql
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;

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
```

---

## Test Your Fix

After applying a fix, test by:

1. **Refresh the admin page** (`/admin/taxes`)
2. **Click "Add Tax Rule"**
3. **Fill in the form:**
   - Tax Name: "Test Tax"
   - Tax Type: Percentage
   - Tax Rate: 10
   - Country: United States
   - Priority: 1
4. **Click "Manifest Tax Rule"**
5. **Check for success message**

If it works, you should see:
- ✅ Success toast: "Tax Rule Created"
- ✅ New rule appears in the table
- ✅ Stats update (Total Rules increases)

---

## Still Not Working?

### Option 1: Manual Insert Test
Try inserting directly in Supabase:

1. Go to Supabase → Table Editor → tax_rules
2. Click "Insert row"
3. Fill in:
   - tax_name: "Manual Test"
   - tax_type: "percentage"
   - tax_rate: 10
   - country: "US"
   - is_active: true
   - priority: 1
4. Click "Save"

If this works, the issue is with the frontend/RLS.
If this fails, the issue is with the table structure.

### Option 2: Check Supabase Service Role
The issue might be that you need to use the service role key for admin operations.

### Option 3: Contact Support
If none of the above works:
1. Copy the exact error from browser console
2. Copy the error from Supabase logs
3. Share the table structure
4. Share the RLS policies

---

## Prevention for Production

Once everything works, secure your tax_rules table:

```sql
-- Secure RLS policies for production
DROP POLICY IF EXISTS "Allow all to read tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow all to insert tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow all to update tax rules" ON tax_rules;
DROP POLICY IF EXISTS "Allow all to delete tax rules" ON tax_rules;

-- Public can only read active rules
CREATE POLICY "Public read active tax rules"
    ON tax_rules FOR SELECT
    USING (is_active = true);

-- Authenticated users can do everything
CREATE POLICY "Authenticated full access"
    ON tax_rules FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

---

## Summary Checklist

- [ ] Table `tax_rules` exists in Supabase
- [ ] RLS is enabled on `tax_rules`
- [ ] RLS policies allow INSERT operations
- [ ] You're logged in to the admin panel
- [ ] Browser console shows no errors
- [ ] All form fields are filled correctly
- [ ] Tax rate is greater than 0

**Most Common Fix:** Run the permissive RLS policies from `tax_system_permissive.sql`

---

Good luck! 🌿✨
