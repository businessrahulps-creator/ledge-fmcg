# Product units for returns and claims — phased plan

## Goal
Let a product have extra units (Bottle, Pouch, kg, Litre…) linked to its main unit, so dealers can return part of a case (e.g. 6 bottles from a 24-bottle case). Credit is worked out from the original bill's price, and good items go back into stock as exact part-units. Orders, bills, prices, offers, buying and GST stay exactly as they are today.

## Agreed rules
1. **Each unit links to the main unit.** "1 Case = 24 Bottle", "1 Bag = 50 kg". A product can have several extra units.
2. **One limit for everything already processed.** For each bill line:
   remaining = billed qty − (good returns + damaged with credit + damaged without credit) from every earlier return or claim on that line.
   Items already processed can never be returned again, even when no credit note was made.
3. **Credit comes from the bill.** Rate = the bill line's taxable value ÷ billed qty (so discounts are included), using that line's own GST rate and supply type.
   - Good: credited and put back in stock.
   - Damaged with credit: credited, not put back.
   - Damaged without credit: recorded and counted against the limit, but no money.
4. **Saved records never change.** Each credit note line and claim line keeps the quantity entered, the unit entered, the conversion and the main-unit amount. Changing a product's units later does not change old records.
5. **Two people at once can't go over the limit.** The database checks the limit while the bill line is locked.
6. **Same approval steps and permissions.** Same return dialog, same claim approval, same credit notes. No new approval steps and no change to who can handle money.

## Phase 0 — Check every place that uses these amounts (before any change)
Go through every database function, trigger, rule, view, report and app calculation that reads stock quantity, stock movements, claim lines or credit note lines. List each one with its finding: safe, needs a fix, or out of scope. Items already found:
- `preview_dispatch_impact` turns stock into whole numbers (`::int`). It needs a fix or it will drop part-units.
- The current return function reads good and damaged amounts as whole numbers (`::int`). It will be rewritten.
- `adjust_stock_atomic` and the Add Stock screen accept whole numbers only. That stays as it is (Add Stock uses main units only). Its stock reads must still keep part-units.
- `stock_deductions.quantity_deducted`, `restore_stock_on_deduction_delete`, dispatch and billing, cancel and reverse dispatch, buying stock moves, and `_buying_move_stock` are checked for whole-number conversions and rounding that would drop part-units.
- App side: stock value, health colours, low-stock alerts, CSV and Tally exports, the backup export, the claims and billing parts of the app, reports and Today's work.
The output is a written list. A function is changed only when it would drop part-units.

## Phase 1 — Database (additive, nothing deleted)
- New `product_units` table (business, product, unit name, how many per main unit, created time). Each unit name appears only once per product. Access is limited to the business, and only people who can manage stock can change it. Grants are included.
- Stock quantity, stock movement change, claim line quantity, and credit note line quantity and restocked amount change from whole numbers to decimals (up to 3 places). Whole numbers convert exactly, so no existing value changes. Existing ">0" and ">=0" rules stay.
- New snapshot columns on credit note lines and claim lines: entered quantity, entered unit, conversion, main-unit quantity. Claim lines also get the bill line link and a type (good, damaged with credit, damaged without credit). All of them can be empty.
- Backfill: old rows get entered qty = qty, unit = the product's unit, conversion = 1.
- Index on the bill line link, so the remaining amount is quick to add up.

## Phase 2 — Server logic
- Rewrite `record_return_and_credit_atomic`, keeping the same name and the existing inputs working:
  - Lock the bill, then its lines (always in the same order, so two saves can't block each other).
  - For each line, convert entered qty ÷ conversion into the main-unit amount (rounded to 3 places). Use the unit stored in `product_units`, not one sent from the screen.
  - Add up everything already processed on that line from both claim lines and credit note lines, counted once. Refuse the save if the new total goes over the billed qty.
  - Work out credit only for good and damaged-with-credit items, using the bill line's rate and tax. Put back stock only for good items, as exact part-units. Record the stock movement.
  - Keep the same idempotency key, company lock, numbering and audit trail.
- Fix any whole-number conversions found in Phase 0. Keep the original signatures. Show stock amounts with up to 3 decimals.

## Phase 3 — App
- **Products**: add "Other units" rows to the product window (name plus "1 {main unit} = N"). Add, edit and remove. Removing a unit doesn't change old records.
- **Stock list**: a small helper line such as "400 Case ≈ 9,600 Bottle". Add Stock stays in main units.
- **Return dialog** (same dialog): each bill line gets a unit picker and three amounts (Good / Damaged, credit / Damaged, no credit). It shows "Remaining: X" in the chosen unit and a live main-unit amount and credit. Save stays off when the amount is over the limit.
- **Claims page**: show the entered unit and amount next to the main-unit amount. Approval stays the same.
- **Display**: a shared formatter drops trailing zeros (10 Case, 10.25 Case). Stock value and health use decimals.
- Customer bills, invoice PDFs and receipts stay unchanged. Credit note print shows the main-unit qty as it does now, plus the entered unit.

## Phase 4 — Tests (kept in the project)
One test per rule:
- 6 Bottle at 24 per case = 0.25 Case.
- Credit uses bill value ÷ qty (discount included) and the line's GST.
- Remaining amount subtracts good, damaged-with-credit and damaged-without-credit returns. Returning 0.5 Case already returned is refused.
- Damaged without credit adds ₹0 but still uses up the limit.
- Only good items go back into stock.
- Database check: two return saves at the same time on the same line can't go over the limit, and one is refused.
- An old credit note keeps its snapshot after the product's units change.
- A stock amount of 0.25 stays 0.25 through stock moves, dispatch preview and exports.

Run the existing billing, stock and claims tests, then try one return in the browser on test data and undo it.

## Protecting history
- Every change only adds. No columns are deleted or renamed. Existing bills, credit notes and stock amounts stay the same value (whole numbers fit exactly into decimals).
- Before the change, count the rows and add up the stock and credit note totals. Check the same numbers after the change.

## Rollback
- Turning the app off: hide the unit pickers and new screens. The return dialog falls back to main units only (conversion = 1), and the rewritten server function handles that as before.
- Database: the new table and columns can stay unused without harm. Going back to whole-number columns is only possible while no part-units exist, so this decimal change is treated as one-way and checked carefully in Phase 0.
- The previous return function is saved in the change history, so it can be restored as it was.

## Out of scope
Orders, invoices and billing, prices, offers and schemes, buying, GST, Add Stock and manual stock changes, and permissions.
