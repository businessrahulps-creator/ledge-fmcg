

# Add Delete Confirmation to Unprotected Delete Paths

## Problem

Two delete actions fire immediately without confirmation:

1. **Stock — Remove Inventory Item**: The "Remove from Warehouse" button inside the stock item edit dialog calls `deleteStockItemFn()` directly — no confirmation.
2. **Dealer Detail — Remove Secondary Sale**: The trash icon on each secondary sale entry calls `api.secondarySales.remove(ss.id)` directly — no confirmation.

All other delete paths (Orders, Dealers, Salespersons, Billing, Schemes, Products, Warehouses) already have proper AlertDialog confirmation.

## Solution

Add an AlertDialog confirmation step to each of these two delete actions, matching the existing pattern used everywhere else.

### 1. `src/pages/Stock.tsx` — Stock item removal

- Replace the direct `deleteStockItemFn` call on the "Remove from Warehouse" button with a state toggle (`confirmDeleteStockItem`) that opens an AlertDialog
- AlertDialog text: "Remove {productName} from {warehouseName}? This action cannot be undone."
- On confirm, call `deleteStockItemFn()` and close the edit dialog

### 2. `src/pages/DealerDetail.tsx` — Secondary sale removal

- Add `deleteSecondarySaleId` state
- Replace the direct `api.secondarySales.remove(ss.id)` call with `setDeleteSecondarySaleId(ss.id)`
- Add AlertDialog: "Remove this secondary sale record? This action cannot be undone."
- On confirm, call `api.secondarySales.remove(deleteSecondarySaleId)` and clear state

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Stock.tsx` | Wrap stock item "Remove from Warehouse" in AlertDialog (~15 lines added) |
| `src/pages/DealerDetail.tsx` | Wrap secondary sale delete in AlertDialog (~20 lines added) |

**2 files modified. No new files. No new dependencies. No database changes.**

