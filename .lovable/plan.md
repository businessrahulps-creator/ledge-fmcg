# Fix: offer type switch and empty product selection

## What goes wrong today
1. Switching an offer from "Buy X Get Y" to "% off" or "Flat" keeps the hidden "Product to buy". The screen shows "All products", but the saved offer quietly works for only that one product.
2. Choosing "Select products" and then unticking every product saves the offer as "All products" with no warning.

## What will change (for the user)
- Switching offer type clears values that belong only to the previous type, so what you see is what gets saved.
- "All products" on screen always means all products.
- If "Select products" is chosen with none ticked, saving shows: "Please select at least one product, or choose 'All products'."
- Editing existing offers keeps their saved products exactly as now.

## Not changing
- How offers are applied on orders, bills, stock, returns, prices or tax.
- Existing saved offers in the database (no data changes).

## Technical details
- `src/lib/scheme-form.ts`
  - `normalizeSchemeForm`: for percentage/flat use only `productIds` (no fallback to leftover `productId`); `null` -> all products (`productIds: null, productId: null`).
  - `validateSchemeForm`: percentage/flat with `productIds` = `[]` returns the error above.
- `src/pages/Schemes.tsx`
  - Type switch (line ~389): to percentage/flat clear `productId`, `freeProductId`, `buyQty`, `freeQty`, `minQty`; to Buy X Get Y clear `productIds`, `minOrderValue` and `setPickProducts(false)`.
  - "Select products" toggle sets `productIds: []`; "All products" keeps resetting to `null`.
  - Edit-load path (line ~160) unchanged, so legacy single-product offers still open as "Select products".
- Tests in `src/lib/scheme-form.test.ts`: leftover `productId` + `productIds: null` saves as all products; `[]` fails validation; picked list saves as-is; Buy X Get Y unchanged.
- Verify: run scheme/order-pricing tests, then live browser check of both scenarios on the Offers page.
