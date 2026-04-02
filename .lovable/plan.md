# Fix Round — 7 Issues

## 1. NewOrder: Save button overlap on mobile
**File**: `src/pages/NewOrder.tsx`
- Line 351: Change `bottom-20` to `bottom-24` to clear the mobile nav bar
- Add `pb-28` to the sidebar column wrapper so summary content isn't hidden behind the sticky button

## 2. Orders: Order detail dialog with editable statuses
**File**: `src/pages/Orders.tsx`
- Add local state: `ordersData` (mutable copy of `orders`), `selectedOrder` (Order | null)
- Add `onClick` to both desktop rows and mobile cards → sets `selectedOrder`
- New dialog shows:
  - Order header (order number, date, dealer, salesperson)
  - Line items table (product, qty, unit price, line total)
  - Editable fields: payment status (3 toggle buttons: paid/partial/pending), delivery status (3 toggles: pending/dispatched/delivered), dispatch date (input), vehicle (input), driver name (input)
  - Save button updates the order in `ordersData` state + shows toast
- Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `Label`, `Input`, `StatusBadge` as needed

## 3. Stock: Auto-scroll to inventory on warehouse select
**File**: `src/pages/Stock.tsx`
- Add `useRef` for the inventory section
- Add `useEffect` watching `selectedWarehouse` — when set, call `ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })`
- Attach ref to the inventory `motion.div` (line 369)

## 4. Stock: Type-to-confirm warehouse delete
**File**: `src/pages/Stock.tsx`
- Add state: `deleteWarehouse` (GodownLocation | null), `deleteConfirmText` (string)
- Replace the instant `removeWarehouse` click with setting `deleteWarehouse`
- New `AlertDialog` shows: warning message with warehouse name, input field where user must type the warehouse name exactly, delete button disabled until input matches
- On confirm: execute the actual delete logic + toast
- Import `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`

## 5. Stock: Edit inventory items (quantity + threshold)
**File**: `src/pages/Stock.tsx`
- Add state: `editStockItem` (StockItem | null)
- Make inventory rows clickable (both desktop `<tr>` and mobile cards) → sets `editStockItem`
- New dialog: shows product name (read-only), quantity (editable input), threshold (editable input), delete button to remove the stock item
- Save updates `stockItemsList` state + toast

## 6. Reports: Sales Team tab
**New file**: `src/components/reports/SalesTeamReport.tsx`
- Pattern: identical to `DistributorReport.tsx` but aggregates by salesperson instead of dealer
- Imports `salespersons`, `orders`, `formatCurrency` from mock data + `TimePeriodFilter`
- Maps salespersons → { name, region, orderCount, revenue }, sorted by revenue desc
- Summary bar: total revenue, total orders, team size
- Desktop table columns: Name, Region, Orders, Revenue
- Mobile cards: same layout as DistributorReport

**File**: `src/pages/Reports.tsx`
- Import `SalesTeamReport`
- Add 5th tab trigger "Sales Team" and corresponding `TabsContent`

## 7. Delete confirmations for Dealers, Sales Team, Products
**File**: `src/pages/Distributors.tsx`
- Add state: `deleteId` (string | null)
- Replace instant `remove()` with setting `deleteId`
- Simple `AlertDialog`: "Are you sure you want to remove [dealer name]? This action cannot be undone." with Cancel/Delete buttons
- Import AlertDialog components

**File**: `src/pages/Salespersons.tsx`
- Same pattern as Dealers: `deleteId` state, AlertDialog confirmation before removing
- Also rename toast messages from "Salesperson" to "Team member"

**File**: `src/pages/Stock.tsx` (Products tab)
- Add state: `deleteProductId` (string | null)
- Replace instant `removeProduct()` with setting `deleteProductId`
- Simple AlertDialog confirmation before deleting

## Implementation order
1. NewOrder save button fix (smallest change)
2. Stock page fixes (scroll, warehouse delete, inventory edit, product delete confirm)
3. Sales Team report + Reports tab
4. Order detail dialog
5. Dealer + Sales Team delete confirmations
