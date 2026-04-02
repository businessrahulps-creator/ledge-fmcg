

# Fix Round — 7 Issues Implementation

## 1. NewOrder: Save button overlap (src/pages/NewOrder.tsx)
- Line 285: Change `<div className="space-y-4 md:space-y-6">` to `<div className="space-y-4 pb-28 md:space-y-6 md:pb-0">`
- Line 351: Change `bottom-20` to `bottom-24`

## 2. Orders: Order detail dialog (src/pages/Orders.tsx)
- Replace `orders` import with mutable `useState` copy (`ordersData`)
- Add `selectedOrder` state (Order | null)
- Add `onClick={() => setSelectedOrder(order)}` to desktop rows (line 102) and mobile cards (line 122)
- Add a Dialog at the bottom of the component showing:
  - Read-only: order number, date, dealer name, salesperson
  - Line items table: product, qty, unit price, line total
  - Editable toggle buttons for payment status (paid/partial/pending) and delivery status (pending/dispatched/delivered)
  - Editable inputs for dispatch date, vehicle, driver name
  - Save button that updates `ordersData` state and shows toast
- Import Dialog components, Label, Input, Separator

## 3. Stock page fixes (src/pages/Stock.tsx)

### 3a. Auto-scroll on warehouse select
- Add `useRef` and `useEffect` imports
- Create `inventoryRef = useRef<HTMLDivElement>(null)`
- Add `useEffect` that calls `inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })` when `selectedWarehouse` changes (and is non-null)
- Attach `ref={inventoryRef}` to the inventory `motion.div` at line 369

### 3b. Type-to-confirm warehouse delete
- Add state: `deleteWarehouse: GodownLocation | null`, `deleteConfirmText: string`
- Replace line 338 delete button `onClick` to set `deleteWarehouse` instead of calling `removeWarehouse`
- Add AlertDialog at bottom: shows "This will permanently delete [name] and all its inventory. Type the warehouse name to confirm.", input field, delete button disabled until text matches warehouse name exactly
- On confirm: execute delete logic (remove from locations, clear selectedWarehouse if matching, remove stock items for that warehouse)
- Import AlertDialog components from `@/components/ui/alert-dialog`

### 3c. Inventory item edit dialog
- Add state: `editStockItem: StockItem | null`
- Make inventory rows clickable: add `onClick={() => setEditStockItem(si)}` to desktop `<tr>` (line 414) and mobile cards (line 435), add `cursor-pointer`
- New Dialog: product name (read-only label), quantity (editable Input), threshold (editable Input), delete button (removes item from stockItemsList)
- Save updates the item in `stockItemsList` + toast

### 3d. Product delete confirmation
- Add state: `deleteProductId: string | null`
- Replace line 246 and 275 delete button `onClick` to set `deleteProductId`
- Add simple AlertDialog: "Are you sure you want to delete [product name]?" with Cancel/Delete

## 4. Sales Team report (new file + Reports update)

### New: src/components/reports/SalesTeamReport.tsx
- Same pattern as DistributorReport.tsx
- Imports `salespersons`, `orders`, `formatCurrency` from mock-data + `TimePeriodFilter`
- Maps salespersons → `{ name, region, orderCount, revenue }`, sorted by revenue desc
- Summary bar: total revenue, total orders, team member count
- Desktop table: Name, Region, Orders, Revenue
- Mobile cards: same layout as DistributorReport

### Update: src/pages/Reports.tsx
- Import `SalesTeamReport`
- Add 5th TabsTrigger value="salesteam" label "Sales Team"
- Add `<TabsContent value="salesteam"><SalesTeamReport /></TabsContent>`

## 5. Delete confirmations (src/pages/Distributors.tsx)
- Add state: `deleteId: string | null`
- Replace line 118 delete `onClick` to set `deleteId` instead of calling `remove`
- Add AlertDialog: "Are you sure you want to remove [dealer name]? This cannot be undone." with Cancel/Remove
- On confirm: execute existing remove logic
- Import AlertDialog components

## 6. Delete confirmations (src/pages/Salespersons.tsx)
- Same pattern as Dealers: `deleteId` state, AlertDialog before removing
- Rename toast messages from "Salesperson" to "Team member"

## Implementation order
1. NewOrder save button fix
2. Stock page (all 4 sub-fixes)
3. SalesTeamReport + Reports tab
4. Orders detail dialog
5. Distributors + Salespersons delete confirmations

