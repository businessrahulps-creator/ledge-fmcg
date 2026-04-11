

# Automated Stock Deduction on Dispatch/Delivery

## Overview
When an order's delivery status becomes "dispatched" or "delivered", automatically deduct stock from the selected warehouse and record deductions in `stock_deductions`.

## Changes

### 1. Database migration: Add `godown_id` column to `orders` table
```sql
ALTER TABLE orders ADD COLUMN godown_id uuid;
```
Nullable for backward compatibility with existing orders.

### 2. Update Order type (`src/data/mock-data.ts`)
Add `godownId?: string` to the `Order` interface.

### 3. Update `mapOrders` in DataContext to include `godownId`
Map `o.godown_id` to `godownId` when reading orders from DB.

### 4. Update `addOrder` in DataContext (`src/context/DataContext.tsx`)
- Include `godown_id` in the insert statement.
- After successful order insert, if `deliveryStatus` is "dispatched" or "delivered" AND `godownId` is set:
  - For each order line, insert into `stock_deductions` and update `stock_items` quantity (subtract).
  - Check if any stock would go negative — show warning toast but proceed.
  - Update local `stockItems` state optimistically.

### 5. Update `updateOrder` in DataContext
- Accept `godownId` in updates and persist `godown_id`.
- When `deliveryStatus` changes TO "dispatched"/"delivered" (from "pending"):
  - Need the order's lines and godownId. Fetch from local state.
  - Perform the same deduction logic (insert `stock_deductions`, update `stock_items`).
  - Show negative-stock warning toast if applicable.
- Do NOT re-deduct if order was already dispatched/delivered (check previous status).

### 6. New Order page (`src/pages/NewOrder.tsx`)
- Add `selectedGodown` state.
- Add "Source Warehouse" dropdown in the Dispatch Details section, showing only active godowns.
- Auto-select if only one active godown exists.
- Require godown selection when delivery status is "dispatched" or "delivered".
- Pass `godownId` in the order object sent to `addOrder`.

### 7. Order detail dialog (`src/pages/Orders.tsx`)
- Add `editGodown` state, initialized from `selectedOrder.godownId`.
- Add "Source Warehouse" dropdown in the dialog.
- Pass `godownId` in the updates to `updateOrder`.
- The `saveOrder` function needs access to the order's previous delivery status to determine if deduction should happen — compare `selectedOrder.deliveryStatus` with `editDelivery`.

### 8. Expose `deductStockForOrder` helper in DataContext
A private helper function used by both `addOrder` and `updateOrder`:
```typescript
async function deductStockForOrder(
  orderId: string, lines: OrderLine[], godownId: string, companyId: string
)
```
- For each line: upsert `stock_deductions`, update `stock_items` quantity.
- Check for negative stock and show warning toast.
- Update local `stockItems` state.

## What stays untouched
- Confetti, notifications, realtime subscriptions
- Health badges, warehouse UI
- Orders that remain "pending" — no deduction
- All existing RLS policies (stock_deductions already has correct RLS)

## Files changed
| File | Change |
|------|--------|
| Migration SQL | Add `godown_id` column to `orders` |
| `src/data/mock-data.ts` | Add `godownId?` to Order interface |
| `src/context/DataContext.tsx` | Add deduction logic in addOrder/updateOrder, map godownId |
| `src/pages/NewOrder.tsx` | Add Source Warehouse dropdown |
| `src/pages/Orders.tsx` | Add Source Warehouse dropdown in edit dialog, pass previous status |

