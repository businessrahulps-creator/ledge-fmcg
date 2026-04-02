

# Report Detail Dialogs — Click-to-View for All Report Tabs

## Problem
All 5 report tabs (Dealers, Products, Payments, Dispatch, Sales Team) show summary rows but clicking any row does nothing. Users expect to see details when they tap an entry.

## Solution
Add a detail Dialog to each report component. When a user clicks a row, a dialog opens showing the breakdown relevant to that entity for the selected time period.

### What each detail dialog shows:

**Dealers tab** — Click a dealer row:
- Dealer name, location, contact (header)
- List of their orders for the period: order number, date, amount, payment status
- Total revenue summary

**Products tab** — Click a product row:
- Product name, SKU, unit, base price (header)
- List of orders containing this product: order number, dealer, qty, line total
- Total units sold + revenue summary

**Payments tab** — Click an order row:
- Already handled by the Orders page detail dialog pattern
- Show order number, dealer, date, line items, payment mode/status, total
- Read-only view (editing happens in Orders page)

**Dispatch tab** — Click an order row:
- Same as Payments: order detail with dispatch-focused info
- Order number, dealer, dispatch date, vehicle, driver, delivery status, line items

**Sales Team tab** — Click a team member row:
- Name, region, phone, email (header)
- List of their orders for the period: order number, dealer, date, amount
- Total revenue summary

### UX details
- Rows get `cursor-pointer` styling so users know they're clickable
- Dialog uses the existing `Dialog` component (already in the project)
- Mobile-friendly: dialog content scrolls, line items in a compact list
- Read-only — reports are for viewing, not editing

### Additional UX issue found
- **PaymentReport still says "distributorName"** in the mobile card (line 76) — should say dealer. Will fix.

## Files to modify (5)
1. `src/components/reports/DistributorReport.tsx` — add dealer detail dialog with their orders
2. `src/components/reports/ProductReport.tsx` — add product detail dialog with order breakdown
3. `src/components/reports/PaymentReport.tsx` — add order detail dialog + fix "distributorName" label
4. `src/components/reports/DispatchReport.tsx` — add order detail dialog with dispatch info
5. `src/components/reports/SalesTeamReport.tsx` — add team member detail dialog with their orders

## Implementation pattern (same across all 5)
- Add `selectedItem` state
- Add `onClick` + `cursor-pointer` to desktop `<tr>` and mobile card `<div>`
- Add `<Dialog open={!!selectedItem} onOpenChange={...}>` with relevant detail content
- Import Dialog components, Separator, formatCurrency from existing files

