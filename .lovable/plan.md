

# Order Deletion — Bug #9 Fix

## Overview
Add DELETE capability for orders: RLS policies, a `deleteOrder` function in DataContext, stock restoration logic, and UI with type-to-confirm dialog.

## 1. Database Migration
- Add DELETE policy on `orders` table: `company_id = get_company_id()`
- Add DELETE policy on `order_lines` table: via join to orders `company_id = get_company_id()`
- Add DELETE policy on `stock_deductions` table: `company_id = get_company_id()`
- Create a trigger function `restore_stock_on_deduction_delete` on `stock_deductions` that, on DELETE, adds `quantity_deducted` back to the matching `stock_items` row
- Attach trigger to `stock_deductions` table (AFTER DELETE FOR EACH ROW)

## 2. DataContext (`src/context/DataContext.tsx`)
- Add `deleteOrder` to interface and provider
- Implementation:
  1. Delete stock_deductions for the order (trigger restores stock automatically)
  2. Delete order_lines for the order
  3. Delete the order itself
  4. Optimistic local state removal
- Expose via context value

## 3. API layer (`src/services/api.ts`)
- Add `orders.delete: (id: string) => data.deleteOrder(id)`

## 4. Orders Page (`src/pages/Orders.tsx`)
- Add `AlertDialog` for type-to-confirm deletion (user must type the order number)
- Add "Delete Order" button in the order detail dialog footer (red/destructive variant)
- Disable the delete button if order is "delivered" (with tooltip/warning)
- On confirm: call `api.orders.delete(id)`, show success toast, close dialogs
- State: `deleteTarget` (Order | null), `deleteConfirmText` (string)

## Files Changed
| File | Change |
|------|--------|
| Migration SQL | DELETE policies on orders, order_lines, stock_deductions + stock restore trigger |
| `src/context/DataContext.tsx` | Add `deleteOrder` function |
| `src/services/api.ts` | Expose `orders.delete` |
| `src/pages/Orders.tsx` | Delete button + confirmation dialog |

