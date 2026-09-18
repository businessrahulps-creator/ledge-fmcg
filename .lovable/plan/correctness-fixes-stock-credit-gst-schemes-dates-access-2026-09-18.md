# Correctness fixes: stock, credit, GST, schemes, dates, access

Ten fixes, one at a time, smallest change each. No redesign, no renamed fields, no new pages.

## What I checked first

- Dispatch-and-bill does deduct stock but never checks whether the warehouse has it — quantity can go negative.
- The credit check is skipped entirely when a dealer's limit is 0, on both the server and the order screens.
- The bill decides CGST/SGST vs IGST from the dealer's typed state code; the GSTIN is never compared against it.
- Scheme savings are sent from the phone and stored as-is; nothing recalculates them, and every matching scheme is added together.
- Order date, target periods, scheme validity and payment date all build "today" from UTC.
- Only the new-order page is locked by role. Money, Company, Settings and Insights are open to anyone signed in. (The "wait before saying no access" behaviour already works.)
- Bills are treated as paid when the balance falls under 50 paise.
- The payment panel talks to the database directly instead of going through the shared data layer.
- The server refuses a payment larger than the balance, but the screen invites you to "save again to record it anyway".
- The saved GST bill stores amount-in-words as an empty string; only the printed copy fills it in.

## Answers to your three questions (what the industry does)

**Credit limit 0.** In ERP practice a blank/zero limit is ambiguous, which is exactly the trap you hit — SAP users regularly report that a zero limit silently approves orders [4](https://community.sap.com/t5/supply-chain-management-q-a/sales-order-no-credit-block-when-credit-limit-0-exposure-0/qaq-p/10303415). The clean fix is to stop overloading one number: a dealer is either **cash only** (no credit at all), **on a limit**, or **no limit set**. I will store "no limit" separately from 0, move today's 0-limit dealers to "no limit set" so nothing breaks overnight, and make 0 mean cash-only for anyone you set that way. Owners with override permission can still push a bill through, and the override is recorded.

**Scheme stacking.** Every scheme engine in this industry carries an explicit stacking rule per scheme; treating two overlapping offers as additive is the classic double-discount leak [1](https://www.vendorrebate.org/core-architecture-promotion-mapping/payout-structure-modeling/handling-overlapping-trade-promotions/) [4](https://sortstring.com/resources/what-is-scheme-management). So: each scheme gets a "can be combined" switch, off by default. Non-combinable schemes compete and only the best one for the dealer applies; combinable ones add on top. The server recalculates the savings and ignores whatever the phone sent.

**Paise.** Your GST bills are already rounded to whole rupees, so a genuine balance is never a few paise — a paise balance means a real short payment. Best practice is a tiny, explicit write-off tolerance rather than a silent one. Bills only count as settled at zero due; anything above zero stays visible and unpaid, and short payments must be closed by a credit note or a receipt, not by hiding them.

## The ten fixes, in your order

1. **Stock guard on dispatch.** Before deducting, check each line against the warehouse quantity and stop with a plain message naming the product and shortfall. Booking is untouched.
2. **Credit terms.** New "no limit / limit amount / cash only" setting on the dealer, existing zeros migrated to "no limit". Server and both order screens enforce it; override needs the override permission.
3. **GSTIN vs state.** Dealer and company forms reject a state that disagrees with the GSTIN's first two digits. The bill derives place of supply from the GSTIN when one exists.
4. **Server-side scheme maths.** Order booking recomputes savings from the stored lines and active schemes, applies the stacking rule, and saves what it computed.
5. **India dates.** Replace every UTC `toISOString` day with the existing India-calendar helper across order date, targets, schemes and payment date.
6. **Route locks.** Money, Company, Team settings and Insights get the same capability gate the new-order page uses.
7. **Honest paid state.** Remove the 50-paise tolerance so part-paid bills stay on the list.
8. **Payments through the data layer.** Move the payment and void calls into the billing domain so dealer outstanding refreshes everywhere.
9. **No false overpay promise.** The screen blocks amounts above the balance instead of offering to save again.
10. **Amount in words on the saved bill.** Filled at the point the bill is created.

## Technical notes

- Server changes go through migrations on `dispatch_and_bill_order_atomic`, `book_order_atomic`, plus `distributors.credit_mode` and `schemes.is_combinable` columns (additive, defaults preserve today's behaviour until migrated).
- Client pricing keeps running through `computeOrderPricing()`; the stacking rule is added there and mirrored in SQL so both agree.
- `PaymentsPanel` stops importing the database client and calls `useApi()`.
- Dates use `src/utils/dateKey.ts`.
- No edits to the generated client, types, env or config keys.
- New tests: stock-guard rejection, credit modes, GSTIN/state mismatch, non-combinable scheme selection, India date boundary at 23:30 IST, paise-due bill state.

## Not in this pass

Partial dispatch, multi-warehouse orders, credit-note-based short-payment write-off, and scheme approval workflows.
