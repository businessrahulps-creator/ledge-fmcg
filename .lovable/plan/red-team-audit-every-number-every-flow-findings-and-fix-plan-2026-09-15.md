# Red-team audit: every number, every flow — findings and fix plan

Two deep code audits plus direct database checks on the ABD demo workspace. Everything below was verified against the real data, not assumed. Findings are ordered by how much damage they do.

## What is broken

### A. Money that does not add up

1. **Bills print lines that don't add up to the total.** 251 of 254 bills carry the GST amount only on the bill header — the item rows hold the pre-GST figure and zero tax. So a bill showing ₹76,889 lists items totalling ₹65,160. Verified on the live rows.
2. **The dealer page shows two different "outstanding" figures side by side.** The top card uses the real balance (bills − receipts − credit notes, with GST). The card below re-invents it from order values only, pre-GST, ignoring bills, receipts and returns. They cannot agree.
3. **The dealer statement is invented, not recorded.** Any order marked "partial" is written into the statement as exactly 50% paid, and "paid" orders as their pre-GST value. It never reads the actual receipts. The closing balance is fiction.
4. **"Collections" on the Command page and the Payment report never look at money received.** They add up order values for orders flagged paid. A part-paid order counts as zero; a discounted order counts too high. These disagree with the Money desk for the same period.
5. **Discounts are subtracted on some pages and not others.** Dashboard and Performance subtract scheme savings; the Command page and its exported PDF do not, so the same dealer shows two revenue figures.
6. **Credit limit ignores missing GST.** When a product has no GST rate set, the check treats its tax as zero. 41 products are in that state, and 1,911 order lines have no rate stored, so orders pass here and get refused at billing.
7. **One legacy ₹1,80,000 "proforma" document sits in the bill archive** with no tax and no matching order shape.

### B. Flows that dead-end

8. **18 returns are stuck "awaiting your decision" with no way to decide.** The screen asks for an approval the app never built.
9. **Orders cannot be cancelled from anywhere.** The backend supports cancel-with-reason; no button reaches it. The only exit is Delete, which is blocked once any money is recorded — so a wrong order with an advance can never be closed.
10. **264 dispatched orders worth ₹1.63 crore still have no bill.** The "Raise bill" path exists but nothing surfaces the backlog as a list to work through.
11. **Secondary sales report success even when they fail.** The save and delete on the dealer page never wait for the result — the toast says "recorded" regardless.
12. **Stock, warehouse and scheme save buttons have no double-click guard**, unlike orders. Two clicks can apply a stock adjustment twice.
13. **Editing an order before dispatch skips checks that apply when creating it** — no stock warning, and a line price of ₹0 is accepted.
14. **18 schemes are marked active but their end date has passed**; nothing flags or hides them.
15. **Warehouse delete shows the raw database error text** instead of a plain message.
16. **Only 3 stock movements are recorded against 1,789 stock deductions** — the movement history starts from the recent fix, so older stock changes have no trail.

## How we fix it

Loop mode as before: one item, fix it, prove it on the demo data, report it, move on.

**Round 1 — money must agree (items 1, 2, 3, 4, 5, 6)**
Make one rule: money owed always means bills (with GST) minus posted receipts minus credit notes. Rewrite the dealer page's second outstanding card and the dealer statement to read real receipts and credit notes instead of guessing from order flags. Point Command's collections and the Payment report at posted receipts. Subtract scheme savings everywhere or nowhere — and label every figure either "Order value" (before GST) or "Billed"/"Collected" (with GST). Backfill the tax split onto the 251 seed bill lines so a bill's items add to its total, and remove the stray proforma. Treat a missing GST rate as blocking, not as zero.

**Round 2 — flows that dead-end (items 8, 9, 10)**
Give returns a real decision: approve or reject, recorded and audited. Add Cancel order with a reason for orders not yet dispatched, including ones holding an advance (the advance stays on the books and is shown as held). Add a "Needs a bill" list so the 264 stranded orders can be worked through.

**Round 3 — save safety (items 11, 12, 13, 15)**
Wait for every save before saying it worked, disable buttons while saving, apply the same stock and price checks when editing an order as when creating it, and replace raw database errors with plain messages.

**Round 4 — housekeeping (items 14, 16)**
Flag expired-but-active schemes. Backfill the stock movement history from the existing deductions so the trail is complete, and remove the old non-atomic stock path still sitting in the code.

Each round ends with the typecheck, the test suite and a signed-in run on the demo account.

## Technical notes

- Canonical balance stays `dealer_outstanding()` / `dealer_balances`. Client code must not recompute it. Retire `orderOutstanding`/`isOutstandingOrder` in `src/lib/aging.ts` as money sources; keep them for ageing buckets only after rebasing on invoices.
- `DealerDetail.tsx:459-480` ledger rebuilt from `invoices` + `invoice_payments (status='posted')` + `credit_notes`.
- `collectionsInPeriod` / `dispatchedRevenue` in `src/lib/command-signals.ts` and `PaymentReport.tsx` move to receipts; `Command.tsx:211,226-227` adopts `netTotal`.
- `gstRateFor` in `NewOrder.tsx:166` / `OrderDetail.tsx:242` must not coerce null to 0 — surface "GST rate not set" and block.
- Seed repair migration recomputes `invoice_lines` cgst/sgst/igst/line_total from `gst_rate` and the invoice's supply type; header totals stay untouched so no bill total changes.
- New RPC `resolve_claim_atomic(p_claim_id, p_decision, p_notes)` — tenant-checked, status guarded, writes `activity_log`.
- Cancel wired to the existing `cancel_order_atomic`; UI blocks only when dispatched or billed.
- `deductStockForOrder` in `useStockDomain.ts:138-174` deleted along with its `DataContext` wiring.
- Movement backfill inserts `stock_movements` rows from `stock_deductions` with `source_doc_type='backfill'`, idempotent on a keyed constraint.

Not in scope: partial shipping, refunds, multi-invoice allocation, e-invoice/e-way bills.
