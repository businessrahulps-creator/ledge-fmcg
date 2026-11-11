# Fix: Other units for returns — Add Product, Edit Product and Returns

## What you will see
1. **Edit Product (existing products):** the "Other units for returns" box is always reachable. The window scrolls, so the box and the Save button are never cut off on smaller screens. You can add units (e.g. "24 Bottle = 1 Case") or archive ones not yet used.
2. **Add Product (new products):** the same box appears. Units you type are held in the form and saved together with the product when you tap Add Product. If the units fail to save, the product stays saved and a clear message tells you to add them from Edit Product.
3. **Returns screen:** every bill line always shows its unit (e.g. "Unit: Case"). When the product has other units, a picker appears to choose Bottle, Case etc., with the "= N Case" equivalence shown live.

## Unchanged
Sales orders, bills, prices, GST, schemes, buying, stock entry, permissions and the server return rules (whole main units only, three return kinds, cumulative limit).

## Technical details
- `src/pages/Stock.tsx`: add `max-h-[85vh] overflow-y-auto` to the product DialogContent (line ~843); render the units editor for both new and existing products.
- `ProductUnitsEditor.tsx`: add a "draft" mode (no productId) that keeps a local list and exposes it to the parent; after `addProduct` returns the new id, insert the drafts into `product_units` (needs `addProduct` to return the created id).
- `src/pages/Claims.tsx`: always show the unit label; keep picker when `unitOptions.length > 1`; refetch units when the dialog opens.
- Verify in the browser: add a product with a unit, edit an existing product and add a unit at 955×646, then open a return on a bill for that product and confirm the picker and equivalence.
