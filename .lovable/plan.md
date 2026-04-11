

# Export CSV Feature — Implementation Plan

## UX Design Decisions

**Button placement**: A single "Export CSV" button per page, placed in the top action bar next to the primary action (e.g. "New Order", "Add Dealer"). On mobile, it renders as an icon-only button (Download icon) to save space. This is the standard B2B SaaS pattern — one click, get your filtered data.

**Filters affect export**: The CSV always exports the **currently filtered/searched** data, not the full dataset. This matches user intent — if they filter "pending payments", they want to export exactly those orders.

**Indian locale formatting**: All dates as DD/MM/YYYY, currency as ₹ with Indian comma grouping (e.g. ₹1,23,456), phone numbers as-is.

**Filename convention**: `{entity}_{YYYY-MM-DD}.csv` (e.g. `orders_2026-04-11.csv`, `dealers_2026-04-11.csv`).

**Feedback**: Sonner success toast "CSV exported successfully" with row count.

## Pages & Columns

### 1. Orders (`Orders.tsx`)
Order #, Date, Dealer, Sales Person, Amount, Payment Mode, Payment Status, Delivery Status, Dispatch Date, Vehicle, Driver, Warehouse

### 2. Dealers (`Distributors.tsx`)
Name, Location, Contact, Total Orders, Total Value

### 3. Sales Team (`Salespersons.tsx`)
Name, Phone, Email, Region, Total Orders, Total Value

### 4. Stock — Products tab (`Stock.tsx`)
Product Name, SKU, Unit, Base Price, Total Sold, Total Stock

### 5. Stock — Warehouses inventory (when a warehouse is selected)
Product Name, SKU, Unit, Quantity, Threshold, Health, Base Price, Stock Value

### 6. Reports tabs — each report tab gets its own export
Columns match what's displayed in that report's table, including the time period filter context.

## Technical Approach

1. **Create `src/utils/exportCsv.ts`** — a shared utility:
   - `exportCsv(filename: string, headers: string[], rows: string[][])` 
   - Handles BOM for Excel compatibility, proper CSV escaping, Blob download, cleanup.

2. **Add export button to each page** — using the `Download` icon from lucide-react, placed alongside existing action buttons. Uses `variant="outline"` to differentiate from primary actions.

3. **Report pages** — add export to each report tab component (DistributorReport, ProductReport, PaymentReport, DispatchReport, SalesTeamReport), exporting the filtered report data.

### Files to create:
- `src/utils/exportCsv.ts`

### Files to modify:
- `src/pages/Orders.tsx` — add export button + handler
- `src/pages/Distributors.tsx` — add export button + handler
- `src/pages/Salespersons.tsx` — add export button + handler
- `src/pages/Stock.tsx` — add export buttons for Products tab and warehouse inventory
- `src/components/reports/DistributorReport.tsx` — add export button
- `src/components/reports/ProductReport.tsx` — add export button
- `src/components/reports/PaymentReport.tsx` — add export button
- `src/components/reports/DispatchReport.tsx` — add export button
- `src/components/reports/SalesTeamReport.tsx` — add export button

No new dependencies. No UI changes beyond the added button.

