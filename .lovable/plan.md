## Problem

The "Add Product to Warehouse" dialog on `src/pages/Stock.tsx` was narrowed to only list products **not yet stocked** in the selected warehouse. When every catalog product is already present (as in Depot — Coimbatore), the picker shows "All products already stocked here" and the button feels broken. The user correctly points out that the original behavior — "add stock for any product" — was simpler and never had this dead-end state.

Row-click already handles editing existing stock, so the dialog adds little value in its current form. Best fix: restore it as a universal **upsert** that works for any product.

## Fix

Rework the Add dialog in `src/pages/Stock.tsx` (lines 986–1045):

1. **Drop the `availableProducts` filter.** List every catalog product in the EntityPicker, regardless of whether it's already stocked in the selected warehouse.
2. **Relabel** dialog title → "Add Stock", description → "Pick a product and enter quantity. If it's already stocked here, this amount will be added to the current quantity." Button → "Add Stock".
3. **For each product option**, append a `meta` chip showing existing quantity in this warehouse (e.g. `In stock: 120`) so the user knows whether they're adding to an existing row or creating a new one. No chip if not yet stocked.
4. **Upsert logic in `handleAddStock`**:
   - If a `StockItem` exists for `(selectedWarehouse, productId)`, call `updateStockItem` with `quantity: existing.quantity + addStockQty`.
   - Else, call `addStockItem` with the new row (existing behavior).
   - Toast copy reflects which path ran ("Added 50 to existing stock" vs "Stocked new product").
5. **Remove the `noneAvailable` branch** and the helper text about "every product already exists" — no longer reachable.

## Out of scope

- No catalog changes (creating brand-new SKUs still happens via the Products tab).
- No schema changes; `StockItem` shape and `addStockItem` / `updateStockItem` signatures are unchanged.
- No visual redesign of the dialog beyond copy.

## Verification

- Open Add Stock in a fully-stocked warehouse → all products listed with "In stock: N" chips.
- Pick an already-stocked product, enter 10 → row quantity increments by 10, toast confirms.
- Pick a not-yet-stocked product → new row created at entered qty, toast confirms.
- `tsc --noEmit` clean.
