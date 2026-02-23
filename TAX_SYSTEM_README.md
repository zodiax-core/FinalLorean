# Tax Management System - Implementation Guide

## Overview
The Lorean Tax Management System provides comprehensive tax rule management with country/region-based rules, product-specific overrides, and automatic checkout integration.

## Features Implemented

### ✅ Admin Tax Management Page (`/admin/taxes`)
- **Create & Manage Tax Rules** - Full CRUD operations
- **Tax Types** - Percentage-based or fixed amount
- **Country/Region Rules** - Target specific countries or regions
- **Product Overrides** - Set custom tax rates for specific products
- **Enable/Disable Rules** - Toggle tax rules on/off
- **Priority System** - Control order of tax application
- **Tax Summary Reports** - View collected taxes and breakdowns

### ✅ Database Schema
- **`tax_rules` table** - Stores all tax configurations
- **Tax fields in `orders`** - `tax_amount` and `tax_breakdown`
- **RLS Policies** - Secure access control
- **Indexes** - Optimized queries for country, status, priority
- **Auto-triggers** - Update timestamps automatically

### ✅ Backend Service (`taxService`)
- `getAll()` - Fetch all tax rules
- `getActive()` - Get only active rules
- `getByCountry(country)` - Country-specific rules
- `create(taxRule)` - Add new tax rule
- `update(id, updates)` - Modify existing rule
- `delete(id)` - Remove tax rule
- `toggleActive(id, isActive)` - Enable/disable rule
- `calculateTax(amount, country, productId?)` - Calculate tax with product overrides
- `getTaxSummary(startDate?, endDate?)` - Generate tax reports

## Database Setup

### 1. Run the Migration
Execute the SQL migration file in your Supabase SQL editor:

```bash
# File location
database/migrations/tax_system.sql
```

This creates:
- `tax_rules` table with all necessary fields
- Indexes for performance
- RLS policies for security
- Default tax rules for major countries (US, UK, Canada, India, Australia)

### 2. Verify Tables
Check that the following exists:
- ✅ `tax_rules` table
- ✅ `orders.tax_amount` column
- ✅ `orders.tax_breakdown` column

## Tax Rule Structure

```typescript
{
  id: string;                    // UUID
  tax_name: string;              // e.g., "VAT", "GST", "Sales Tax"
  tax_type: 'percentage' | 'fixed';
  tax_rate: number;              // Percentage (e.g., 20) or fixed amount (e.g., 5.00)
  country: string;               // ISO country code or "GLOBAL"
  region: string | null;         // Optional state/province
  is_active: boolean;            // Enable/disable
  priority: number;              // Lower = higher priority
  product_overrides: {           // Product-specific rates
    [productId: number]: number;
  };
  created_at: timestamp;
  updated_at: timestamp;
}
```

## Usage Examples

### Admin - Create Tax Rule
```typescript
await taxService.create({
  tax_name: "VAT",
  tax_type: "percentage",
  tax_rate: 20,
  country: "GB",
  region: null,
  is_active: true,
  priority: 1,
  product_overrides: {
    123: 5,  // Product #123 has 5% tax instead of 20%
    456: 0   // Product #456 is tax-exempt
  }
});
```

### Checkout - Calculate Tax
```typescript
// In your checkout page
const { taxAmount, taxName, breakdown } = await taxService.calculateTax(
  100,        // Subtotal amount
  "US",       // Customer's country
  productId   // Optional: for product-specific rates
);

// Apply to order
const total = subtotal + shipping + taxAmount;
```

### Tax Breakdown Example
```typescript
{
  taxAmount: 20.00,
  taxRate: 20,
  taxName: "VAT",
  breakdown: [
    {
      name: "VAT",
      rate: 20,
      type: "percentage",
      amount: 20.00
    }
  ]
}
```

## Integration with Checkout

### Update Checkout Page
Add tax calculation to your checkout flow:

```typescript
import { taxService } from "@/services/supabase";

// In your checkout component
const [taxInfo, setTaxInfo] = useState({ taxAmount: 0, breakdown: [] });

// Calculate tax when country changes
useEffect(() => {
  if (shippingAddress.country && subtotal > 0) {
    taxService.calculateTax(subtotal, shippingAddress.country)
      .then(setTaxInfo)
      .catch(console.error);
  }
}, [shippingAddress.country, subtotal]);

// Display in order summary
<div className="flex justify-between">
  <span>Tax ({taxInfo.taxName})</span>
  <span>${taxInfo.taxAmount.toFixed(2)}</span>
</div>

// Save to order
await ordersService.create({
  ...orderData,
  tax_amount: taxInfo.taxAmount,
  tax_breakdown: taxInfo.breakdown,
  total: subtotal + shipping + taxInfo.taxAmount
});
```

## Tax Reports

### Generate Summary
```typescript
// Get tax summary for all time
const summary = await taxService.getTaxSummary();

// Get summary for date range
const summary = await taxService.getTaxSummary(
  "2024-01-01",  // Start date
  "2024-12-31"   // End date
);

// Returns:
{
  totalTaxCollected: 5000.00,
  orderCount: 250,
  averageTax: 20.00,
  byTaxType: {
    "VAT": 3000.00,
    "Sales Tax": 2000.00
  }
}
```

## Country Codes Reference

Common country codes used:
- `US` - United States
- `GB` - United Kingdom
- `CA` - Canada
- `AU` - Australia
- `DE` - Germany
- `FR` - France
- `IN` - India
- `JP` - Japan
- `CN` - China
- `BR` - Brazil
- `GLOBAL` - Applies to all countries

## Product-Specific Tax Overrides

### Use Cases
1. **Tax-Exempt Products** - Set override to `0`
2. **Reduced Rate Items** - Food, books may have lower tax
3. **Luxury Tax** - Higher rate for premium items

### Example
```typescript
// In admin tax rule form
product_overrides: {
  101: 0,    // Product 101 is tax-exempt
  102: 5,    // Product 102 has 5% tax
  103: 25    // Product 103 has luxury 25% tax
}
```

## Priority System

When multiple tax rules apply to the same country:
- Rules are applied in **priority order** (1 = highest)
- Lower priority number = applied first
- Useful for compound taxes (e.g., GST + PST in Canada)

## Best Practices

1. **Test Tax Calculations** - Verify rates before going live
2. **Keep Rules Updated** - Tax laws change frequently
3. **Use Regions** - For state/province-specific taxes
4. **Monitor Reports** - Regular tax summary reviews
5. **Backup Rules** - Export tax configurations periodically

## Troubleshooting

### Tax Not Applying at Checkout
- ✅ Check tax rule is `is_active: true`
- ✅ Verify country code matches exactly
- ✅ Ensure checkout is calling `taxService.calculateTax()`

### Wrong Tax Amount
- ✅ Check tax type (percentage vs fixed)
- ✅ Verify tax rate value
- ✅ Review product overrides
- ✅ Check priority order for multiple rules

### Tax Summary Shows Zero
- ✅ Ensure orders have `tax_amount` saved
- ✅ Check date range in summary query
- ✅ Verify orders aren't cancelled

## Security Notes

- ✅ RLS policies protect tax rules
- ✅ Only authenticated users can modify rules
- ✅ Public can view active rules (for checkout)
- ✅ Tax calculations happen server-side

## Future Enhancements

Potential additions:
- [ ] Tax exemption certificates
- [ ] Automatic tax rate updates via API
- [ ] Multi-currency tax support
- [ ] Tax filing export (CSV/PDF)
- [ ] Audit trail for tax changes

---

**Tax System Status**: ✅ Fully Implemented & Ready for Production

The tax system is now integrated with your checkout flow and can be managed through the admin panel at `/admin/taxes`.
