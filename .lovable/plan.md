

# Fix: Show Effective Total (After Scheme Savings) in Order Details

## Problem
The order detail dialog and order list show only the raw `order.total`, ignoring scheme savings. A business owner expects the displayed total to reflect the actual effective amount after discounts.

## Changes

### `src/pages/Orders.tsx`

**1. Order detail "Total" stat card (line 407-410)**
- Show effective total: `order.total - order.schemeSavings`
- If savings > 0, show the original total as a struck-through smaller text above the effective total
- Label changes from "Total" to "Effective Total" when savings exist

**2. Order list table row (line 334)**
- Show effective total in the amount column: `formatCurrency(order.total - order.schemeSavings)`

**3. Mobile order card (line 352)**
- Same: show effective total

**4. Schemes Applied box (already working per screenshot)**
- Keep as-is — it correctly shows individual scheme savings and total savings

### `src/components/pdf/OrderInvoicePdf.tsx`
- Already has scheme savings and effective total lines — no changes needed

## Summary
Three targeted edits in Orders.tsx to replace raw `order.total` displays with the effective total after scheme savings, with a visual strikethrough of the original price when savings apply.

