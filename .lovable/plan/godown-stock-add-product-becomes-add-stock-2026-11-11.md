# Godown stock: "Add Product" becomes "Add Stock"

## What I found
- Inside a godown, the button says **Add Product**, but it already opens an **Add Stock** window: pick an existing product, enter a quantity, and it adds that amount to this godown's stock.
- It never creates or edits a product. It saves through the existing safe stock function, which also records the stock movement and the Activity entry.
- So the only real mismatch is the button label. The steps behind it already match what you asked for.

## Changes (Stock page only)
1. **Button label**: change "Add Product" to **Add Stock** inside a selected godown. Phones keep the short "Add". Same icon and same permission: only people allowed to manage stock see it.
2. **Window polish**:
   - The title shows which godown you're adding to, e.g. "Add Stock — Main Godown".
   - Under the quantity box, a live line shows the result, e.g. "Now 120 → after adding 150".
   - Quantity starts at 1, not 0, so Save works without extra taps.
   - The Save button stays off until a product is picked and the quantity is above 0.
3. **Out-of-date screen safety**: right before saving, take the current amount from the latest data, so two people adding stock at once don't overwrite each other's numbers.

## Not changing
- The Products list keeps its own **Add Product** button for creating new products.
- No changes to product details, prices, low-stock levels, existing stock records, stock deduction on dispatch, or reports.
- No database changes.

## Checks
- Run the existing stock tests and add one small test: adding 50 to a stock of 120 saves 170 for that product in that godown.
- Check in the browser: open a godown, click Add Stock, add a quantity, see the new total in the list, then put the sample back the way it was.

## Technical notes
- `src/pages/Stock.tsx`: label at ~line 762; dialog at ~1124; `handleAddStock` reads the latest `stockItemsList` entry, then calls the existing `updateStockItem` / `addStockItem` (both go through `adjust_stock_atomic`).
