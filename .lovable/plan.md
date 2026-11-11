# Product units for returns and claims — final phased plan

## Scope (unchanged)
Products can have extra named units (Bottle, Pouch, kg…) linked to the main unit. These units are used **only** in returns and claims, plus a read-only helper on the stock list. Orders, bills, prices, offers, buying, GST, Add Stock, approval steps and permissions all stay as they are.

---

## 1. One source of truth for returned quantities (no double counting)

**How returns work today (checked):** only one server function, `record_return_and_credit_atomic`, handles a return against a bill. In one save it writes a claim line **and** a credit note line, so adding up both would count the same return twice. Claims are never created another way (the app can't add claims directly), and `resolve_claim_atomic` only changes the claim's status.

**Decision:** add a new table, **`return_line_ledger`**. It is the only place that counts how much of a bill line has been processed. The return function writes one row for each bill line and each type:
- `kind`: good (put back in stock, credited) / damaged with credit / damaged without credit
- entered quantity, entered unit, conversion, main-unit quantity
- links to the claim line and to the credit note line (if there is one). Each link can be used only once.

Claim lines and credit note lines keep their own copy of these values so old documents can be shown again exactly as saved. They are **never added up** to check the limit.

**Remaining for a bill line** = billed qty − total main-unit quantity in `return_line_ledger` for that line, across all three types.

**Old records (backfill):**
- Each existing credit note line becomes good = `restocked_quantity` and damaged-with-credit = `quantity − restocked_quantity`.
- Old claim lines made by the same save are **not** added again, because they are the same items.
- Older claims that are not linked to any bill line can't be matched to a line. They are left out, and the backfill report lists how many.

## 2. Locking order (the same for every return)
`record_return_and_credit_atomic` is the only way to process a return, and it is kept that way. Inside one database transaction, it locks in this fixed order:
1. The business's money lock (the same lock the money functions already use)
2. The bill (`FOR UPDATE`)
3. The bill's lines (`ORDER BY id FOR UPDATE`)
4. The stock rows it touches (`ORDER BY product_id, godown_id FOR UPDATE`)

It works out the remaining amount **only after these locks are taken**, by reading `return_line_ledger` again. If two returns are saved at once, the second one waits and then sees the first one's rows. A database rule also refuses any ledger row that would take a line past its billed amount, as a backstop. No other function writes to the ledger, and the app gets no direct write access to it.

## 3. Precision rule
- **Conversion** `numeric(18,6)`, must be above 0 (e.g. 24, or 0.5).
- **Entered quantity** is stored exactly as typed (up to 3 decimals).
- **Main-unit quantity** = entered ÷ conversion, rounded **once** to 6 decimals and stored in the ledger, stock movement and stock row. That same stored number is used everywhere, so the limit, stock and reports always agree.
- **Stock columns** (`stock_items.quantity`, `stock_movements.delta`, claim/credit note quantities) become `numeric(18,6)`. Whole numbers carry over exactly.
- **"Fully returned":** remaining amounts below 0.000001 main units count as zero. That covers leftovers like 7 × (1/7 case).
- **Money:** credit = ROUND(bill taxable value × entered qty ÷ (billed qty × conversion), 2). It is rounded once, from the entered quantity, never from a rounded main-unit amount. GST is then worked out the same way as now.
- **On screen only:** quantities show up to 3 decimals with trailing zeros removed. The stored value is never rounded.

## 4. Rollback is safe because every reader handles decimals
Hiding the screens doesn't make going back safe. So this order is required: **every function that reads or writes stock must handle decimals before any decimal value can exist** (step A comes before steps B–D below). After step C, the old return function can never come back, because it treats amounts as whole numbers. "Rollback" means switching the new function to main-units only (conversion = 1). It doesn't mean going back to old code.

---

## 5. Phase 0 dependency check (taken from the live database and the app)

| Item | Current behaviour | Risk once decimals exist | Action | Workflow |
|---|---|---|---|---|
| `tg_audit_row` | Reads stock movement delta as a whole number (`(j->>'delta')::int`) | **Errors on 0.25, which cancels the whole save** | Read it as a decimal | Every stock change, Activity |
| `dispatch_and_bill_order_atomic` | Stock check uses `SUM(qty)::int` and `MAX(si.quantity)::int` | `::int` **rounds** (4.5 becomes 5), so it could let through more than is in stock, and the save then fails on the "no negative stock" rule | Compare as decimals | Dispatch & bill |
| `preview_dispatch_impact` | Returns whole numbers only, with `::int` | Shows rounded stock before dispatch | Return decimals (new version, app updated) | Dispatch preview |
| `adjust_stock_atomic` | Takes a whole-number new total; change is a whole number | The Add Stock / edit total is sent as current + added, so a 120.25 stock would lose its .25 | Add a decimal version and keep `v_delta` as a decimal. Add Stock still sends whole amounts to add | Add Stock, manual edits |
| `_buying_move_stock` | Whole-number change, adds on top | None (buying amounts stay whole; adding keeps fractions) | Keep the whole-number signature; the stored column becomes decimal | Purchase bill, cancel, return |
| `reverse_dispatch_for_order` | Adds back whole order amounts | None | Check with a test only | Cancel order |
| `restore_stock_on_deduction_delete` (trigger) | Adds back `quantity_deducted` (whole number) | None | Test only | Delete order |
| `delete_order_atomic`, `cancel_order_atomic` | Go through the reverse/restore steps above | None | Test only | Delete/cancel |
| `delete_godown_atomic` | Checks whether any stock is above 0 | 0.25 still counts as above 0, so it's correct | Test only | Remove godown |
| `record_return_and_credit_atomic` | Reads good/damaged as whole numbers (`::int`), one ROUND for money | Drops decimals | Rewrite (sections 1–3) | Returns |
| `resolve_claim_atomic` | Changes status only, no stock | None | No change | Claim approval |
| Views `invoice_balances`, `dealer_balances`, `order_aging`, `dealer_aging` | Money only | None | None | Balances |
| `stock_deductions.quantity_deducted`, `stock_items.threshold` | Whole numbers | Not affected (order amounts stay whole) | Keep as whole numbers | — |
| App: `data-utils.ts` claim/stock mapping, `useBillingDomain.ts` returned totals | `x \|\| 0`, keeps decimals | Returned totals currently add up claim lines | Read the remaining amount from the ledger | Return dialog |
| App: `Stock.tsx` totals, health, edit box | Adding up is fine; the edit box takes whole numbers | Saving an edit could drop .25 | The edit box shows the existing decimal and keeps it when only whole units are added | Stock |
| App: `intelligence.ts` days of stock | `Math.floor(days)`, `Math.round(value)` | For display only | None | Today's work |
| Reports `registry.ts` (stock, stock value), `exportBackup.ts`, Tally (`tallyData.ts`) | `n()` keeps numbers as they are | CSV may show long decimals | Format with the shared 3-decimal helper; CSV safety rules unchanged | Reports, exports |
| `Command.tsx`, `ProductsTab.tsx` stock totals | Adding up only | None | Use the shared formatter for display | Command |

**Step 0 deliverable:** before Phase 1, run this check again with a search over all function code (`::int`, `integer`, `ROUND`, `FLOOR`, `TRUNC`) and save the result in the plan archive. Anything new it finds is added to this table.

---

## Migration order
- **A. Make every reader handle decimals** (no column changes yet): fix `tg_audit_row`, the dispatch stock check, a new `preview_dispatch_impact`, and a decimal version of `adjust_stock_atomic`. Release the matching app reader changes. All of these are safe with whole-number data.
- **B. Widen the columns** to `numeric(18,6)`. Add the `product_units` table, the `return_line_ledger` table with its limit rule, and the snapshot columns on claim lines and credit note lines (all can be empty). Includes grants, access rules and indexes. Then backfill the ledger and snapshots.
- **C. New return function** (same name, existing inputs still work, and it accepts unit fields).
- **D. App:** units on the product window, the stock helper line, and in the return dialog a unit picker, the three amounts and a live "Remaining".

## Data checks (before and after B, saved)
- Row counts, plus SUM of `stock_items.quantity` per business, SUM of `stock_movements.delta`, and SUM of credit note line quantity and money, must match exactly.
- For each stock row, stock = SUM(movements) wherever that held before the change.
- Ledger total per bill line ≤ billed qty for every line. Any line already over before the change is listed, not changed.

## Tests (kept in the project)
- 6 Bottle at 24 = 0.25 Case. 1 of 7 per case, returned 7 times, ends fully returned with no leftover.
- Credit is rounded once from the entered quantity and includes the bill's discount and GST rate.
- Remaining counts good + damaged-with-credit + damaged-without-credit, and refuses repeats.
- Damaged without credit adds ₹0 and still uses up the limit.
- Only good items go back into stock.
- A single save that writes both a claim line and a credit note line counts once.
- Two return saves at the same time (database test, two connections): one goes through and the other is refused.
- Stock of 0.25: the dispatch check, preview, Activity entry, cancel, delete order, Add Stock and exports all keep 0.25.
- An old credit note still shows the same after the product's units change.
- Existing billing, stock, claims and receipt tests pass.

## Rollback limits
- Steps A, B and the new tables can stay unused with no harm.
- **The decimal column change is one-way** once any part-unit exists. Going back to whole-number columns would lose data, so it won't be done.
- After step C, the old return function is **not** restored. The rollback is the new function running in main-units-only mode.
- Turning off step D only hides the unit choices. Every reader still keeps decimals because of step A.

## Not changing
Orders, invoices and bill printouts, prices, offers, buying documents, GST, the Add Stock flow, claim approval steps and permissions.
