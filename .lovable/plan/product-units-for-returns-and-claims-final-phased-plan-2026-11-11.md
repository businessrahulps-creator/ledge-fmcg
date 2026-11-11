# Product units for returns and claims — final phased plan

## Scope (unchanged)
Each product can have extra named units (Bottle, Pouch, kg…) linked to its main unit. These units are used **only** for returns and claims, plus a read-only helper line on the stock list. Orders, bills, prices, offers, buying, GST, Add Stock, approval steps and permissions stay exactly as they are.

---

## 1. One record of what's been returned (no double counting)
Today, only `record_return_and_credit_atomic` handles a return against a bill. Each return writes both a claim line and a credit note line, so adding up both would count it twice. Claims can't be created directly from the app, and `resolve_claim_atomic` only changes the status.

**New `return_line_ledger`** is the only place that counts how much of each bill line has been returned. It gets one row per bill line per kind of return:
- **Kind:** good (restocked and credited), damaged with credit, or damaged without credit
- **What was entered:** quantity, unit, conversion, and the equivalent in the main unit
- **Links:** to the claim line and, when there is one, the credit note line

Claim lines and credit note lines keep their own snapshot copies so they can show what was entered. They are **never added up** for limits.

**Remaining for a bill line** = billed quantity − sum of the ledger's main-unit quantities for that line, across all three kinds.

**Backfill of old returns:**
- Each existing credit note line becomes good = `restocked_quantity` and damaged-with-credit = `quantity − restocked_quantity`.
- Old claim lines from the same save are **not** added again.
- Older claims that aren't linked to any bill line can't be matched. They are listed in the backfill report and left out.

## 2. Locking order
`record_return_and_credit_atomic` stays the only way to process a return. Inside one transaction it locks, always in this order:
1. The business's money lock
2. The bill (`FOR UPDATE`)
3. The bill's lines (`ORDER BY id FOR UPDATE`)
4. The product units used (`FOR SHARE`)
5. The stock rows (`ORDER BY product_id, godown_id FOR UPDATE`)

The remaining quantity is worked out from the ledger **only after these locks are taken**. If two returns are saved at once, the second one waits and then sees what the first one saved.

## 3. Precision
- **Conversion:** `numeric(18,6)`, must be above 0.
- **Entered quantity:** saved exactly as typed, up to 3 decimals.
- **Main-unit quantity** = entered ÷ conversion, rounded **once** to 6 decimals. The same saved number is written to the ledger, the stock movement and the stock row.
- **Stock columns** (`stock_items.quantity`, `stock_movements.delta`, claim and credit note quantities) become `numeric(18,6)`. Existing whole numbers carry over exactly.
- **Last-piece snap (fixes the 1/7 case):** while the locks are held, if the entered amount equals what's left in that unit (remaining × conversion, rounded to 3 decimals), the saved main-unit amount is set to **exactly the remaining amount**. Example: 7 returns of 1 Bottle at 7 per Case save 0.142857 six times and 0.142858 the last time. That adds up to exactly 1.000000, and the ledger, stock movement and stock row all get the same number.
- **Fully returned** means remaining ≤ 0.000005, which only absorbs rounding. Because of the snap, real leftovers end at exactly 0. A saved amount can never be more than what's left.
- **Money:** credit = ROUND(bill taxable value × entered quantity ÷ (billed quantity × conversion), 2). It is rounded once, from the entered quantity, then GST is worked out as it is today.
- **Display:** up to 3 decimals, with trailing zeros removed. Saved values are never rounded for display.

## 3a. Database protections (they hold even if the app is skipped)
- **No direct writes:** signed-in users can only read their own business's rows. Only the return function can write, and it is closed to public calls. Rows are never edited or deleted. A reversal would be a new row with the opposite sign.
- **No duplicate links:** each claim line can be linked only once, and so can each credit note line. Damaged-without-credit rows must have no credit note line. The other two kinds must have one.
- **Valid links:** a check before every insert makes sure:
  - the bill line belongs to the bill
  - the bill belongs to the business
  - the claim line and credit note line belong to the same bill line and product
  - the business matches
  Any mismatch is refused.
- **Limit:** the same check locks the bill line and refuses any row that would take the ledger total over the billed quantity, beyond the 0.000005 rounding allowance.
- **Values:** quantity and conversion must be above 0, and the kind must be one of the three.

## 3b. Units are checked on the server
- The app sends the **unit's id** (or "main unit") and the quantity. Any conversion the app sends is ignored.
- The function loads the unit from `product_units` and checks it belongs to **this business and this bill line's product**. If not, the return is refused. The main unit always means conversion = 1.
- The unit is locked during the save. Its name and conversion are copied into the ledger, claim line and credit note line.
- Units are archived, not deleted. A unit's conversion can't be changed once it has been used in a return. To change packaging, add a new unit.
- If a unit is archived or changed while a return window is open, saving is refused with "This unit changed — please pick it again". Nothing is saved.
- Units are managed with the existing stock permission. No new permissions.

## 4. Rollback safety
Every function that reads or writes stock must handle decimals **before** any decimal value can exist (Phase 1 comes before Phases 2–4). After Phase 3, the old return function is never restored, because it treats quantities as whole numbers. Rollback means running the new function with main units only (conversion = 1).

---

## 5. Dependency audit (live database and the app)

| Item | Today | Risk with decimals | Action | Workflow |
|---|---|---|---|---|
| `tg_audit_row` | reads `(j->>'delta')::int` | **Errors on 0.25 and cancels the save** | Read as a decimal | Every stock change, Activity |
| `dispatch_and_bill_order_atomic` | `SUM(qty)::int`, `MAX(si.quantity)::int` | `::int` rounds (4.5→5), so it can let through more than is in stock, and then the save fails | Compare as decimals | Dispatch & bill |
| `preview_dispatch_impact` | Whole-number outputs (`::int`) | Shows rounded stock | Decimal outputs; app updated | Dispatch preview |
| `adjust_stock_atomic` | Takes a whole-number new total, whole-number change | Add Stock sends current + added, so 120.25 would lose 0.25 | Decimal version; change kept as a decimal | Add Stock, edit |
| `_buying_move_stock` | Whole-number change, added on | None | Keep it; column widened | Buying |
| `reverse_dispatch_for_order` | Adds whole order quantities back | None | Test | Cancel order |
| `restore_stock_on_deduction_delete` | Adds `quantity_deducted` back | None | Test | Delete order |
| `delete_order_atomic`, `cancel_order_atomic` | Use the two above | None | Test | Delete/cancel |
| `delete_godown_atomic` | Checks stock > 0 | Correct | Test | Remove godown |
| `record_return_and_credit_atomic` | Reads good/damaged as `::int` | Drops fractions | Rewrite (sections 1–3b) | Returns |
| `resolve_claim_atomic` | Changes status only | None | None | Claim approval |
| Views `invoice_balances`, `dealer_balances`, `order_aging`, `dealer_aging` | Money only | None | None | Balances |
| `stock_deductions.quantity_deducted`, `stock_items.threshold` | Whole numbers | Not affected | Keep | — |
| App `data-utils.ts`, `useBillingDomain.ts` | Keep decimals; "returned" adds up claim lines | Double counting | Read remaining from the ledger | Return dialog |
| App `Stock.tsx` totals, health, edit box | Edit box is whole numbers only | Saving could drop the decimal part | Edit box keeps existing decimals | Stock |
| App `intelligence.ts` | `Math.floor` on days, `Math.round` on value | Display only | None | Today's work |
| `registry.ts`, `exportBackup.ts`, `tallyData.ts` | `n()` keeps the value | Long decimals in files | Shared 3-decimal formatter; CSV safety kept | Reports, exports |
| `Command.tsx`, `ProductsTab.tsx` | Add up only | None | Formatter | Command |

Phase 0 runs this search again across all function code (`::int`, `integer`, `ROUND`, `FLOOR`, `TRUNC`) and adds anything new to this table before work starts.

---

## All phases
- **Phase 0 — Audit:** finish the table above and save the "before" totals.
- **Phase 1 — Make readers decimal-safe:** fix the trigger, the dispatch stock check, the preview, and the decimal stock-adjust version. Release the app's matching reader changes. All of this is safe with whole numbers.
- **Phase 2 — Database:**
  - Widen the stock columns to `numeric(18,6)`.
  - Add `product_units`, with archiving and conversions locked once used.
  - Add `return_line_ledger` with its protections.
  - Add snapshot columns to claim lines and credit note lines.
  - Set access rules, permissions and indexes.
  - Backfill old returns, then run the data checks.
- **Phase 3 — Server:** the new return function, with locking, unit checks, last-piece snap and ledger writes. Same name, and the existing inputs still work.
- **Phase 4 — App:**
  - Units on the product window
  - Stock helper line
  - Return dialog: unit picker, three amounts and live "Remaining"
  - Claims page shows the entered unit
  - Shared formatter
- **Phase 5 — Tests and browser check:** the tests below, then one return on test data in the browser, which is then removed.
- **Phase 6 — Release and watch:** check Activity, stock and credit totals after release.

## Data-integrity checks (before and after Phase 2, saved)
- Row counts, the sum of stock quantity per business, the sum of movements, and credit note quantities and money all match exactly.
- Stock = sum of movements wherever that was true before.
- For every bill line, the ledger total ≤ billed quantity. Lines that were already over are listed, not changed.

## Tests (kept in the project)
- 6 Bottle at 24 per Case = 0.25 Case.
- 1 Bottle at 7 per Case, returned 7 times: the ledger total is exactly 1.000000, stock goes up by exactly 1.000000, remaining = 0, and an 8th return is refused.
- Credit is rounded once from the entered quantity, using the bill's discount and GST rate.
- Remaining counts all three kinds, and repeat returns are refused.
- Damaged without credit gives ₹0 credit but still uses up the remaining quantity.
- Only good returns restock.
- One save that writes both a claim line and a credit note line is counted once.
- Two returns saved at the same time (two connections): one succeeds and one is refused.
- Database: a direct insert into the ledger, a link to another business, a reused link, and an insert over the limit are all refused.
- Units: a unit from another business or product is refused; a conversion sent by the app is ignored; an archived or changed unit mid-return is refused; old records stay the same after unit changes.
- Stock of 0.25 stays 0.25 through dispatch, preview, Activity, cancel, delete order, Add Stock and exports.
- Existing billing, stock, claims and receipt tests still pass.

## Rollback limits
- Phases 1–2 and the new tables can sit unused without harm.
- **Widening the columns is one-way** once any fraction exists. Changing them back would lose data.
- After Phase 3, the old return function is not restored. Rollback means main units only.
- Turning off Phase 4 only hides the unit choices. Everything that reads stock still keeps decimals.

## Not changing
Orders, invoices and printouts, prices, offers, buying documents, GST, the Add Stock flow, claim approval steps and permissions.

---

## Phase 0 results (2026-11-11, read-only, nothing changed)

### Baseline totals (whole database)
| Data | Rows | Total |
|---|---|---|
| Stock items (quantity) | 452 | 38,433,271 (0 fractional) |
| Stock movements (delta) | 3,999 | 38,433,372 |
| Claim lines (quantity) | 65 | 1,239 |
| Credit note lines (quantity / restocked) | 18 | 646 / 539 |
| Credit notes (grand total) | 18 | ₹296,338.00 |
| Claims (claim value) | 59 | ₹515,172.00 |
| Stock deductions (quantity) | 3,476 | 145,133 |
| Invoice lines (quantity) | 2,300 | 97,365 |
Other checks: 11 businesses have stock; 0 bill lines returned beyond the billed quantity; 0 credit note lines without a link to their bill line.

### Findings
1. **4 stock rows already differ from their movement history** before any change (448 of 452 match). Differences: 99,922 vs 99,937, 6 vs 22, 1,028 vs 1,038, 110 vs 170. These are seed or older data. The rule "stock = sum of movements" is therefore checked only for the 448 rows that match today, and these 4 are listed but not changed.
2. **42 claims have no credit note and no link to a bill line.** They are seed or older order-level claims: shortage, return and damage, some open and some resolved, worth ₹220,920. They can't be matched to a bill line, so they can't count toward a line's limit. **Owner decision needed:** (a) exclude them, which is the plan default, or (b) block new returns on any order that has an open old-style claim, until that claim is resolved.
3. **More whole-number functions found, all outside scope.** `book_order_atomic`, `record_purchase_bill_atomic` and `return_purchase_atomic` read order and buying quantities as whole numbers. Orders and buying stay in main units, so this is correct and no change is needed. `book_order_atomic` uses FLOOR for scheme sets, which is unchanged pricing logic. `delete_godown_atomic` has a whole-number counter that counts rows, not quantities, so it's safe.
4. **App callers confirmed:** `adjust_stock_atomic` is called from `useStockDomain.ts`, `preview_dispatch_impact` from `OrderDetail.tsx`, and the return function from `useBillingDomain.ts`. In `Claims.tsx`, remaining = billed − returned, and returned currently comes from adding up claim lines. Phase 4 switches this to the ledger.
5. **Audit table in section 5 confirmed.** The only Phase 1 fixes needed are `tg_audit_row`, the dispatch stock check, `preview_dispatch_impact` and a decimal version of `adjust_stock_atomic`.
