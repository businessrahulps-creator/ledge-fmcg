# Second audit pass — what the re-test found

I ran the same end-to-end checks again on your live seed data. The money core held up: dealer balances match to the rupee across all 110 dealers, every bill's lines add up to its total, no payment is missing its order or bill link, no negative stock, no duplicate bills for one order, no duplicate targets. The earlier fixes are holding.

Here is what is still wrong, worst first.

## Confirmed bugs

1. **Return preview shows the wrong amount.** When you enter a return, the screen shows the value before GST, but the credit note actually raised includes GST. Verified in the code and by the earlier live test: preview said ₹360, credit note came to ₹425. People will promise the dealer the wrong figure.

2. **Old "Paid" marks left in the database.** 460 orders still carry a "paid" flag in storage with no receipt behind them. The screens now work off real receipts so they read correctly, but exports and any future report that trusts the stored flag will be wrong. The stored flag should be retired or corrected.

3. **List pages can show the wrong page after filtering.** Paging resets only when the number of results changes. Switch a filter and land on a list of the same size and you stay on page 3 of the old list.

4. **Two delivered orders have no dispatch date** (ABD-2026-0533, ABD-2026-0544), so their dispatch reports and delivery timelines are blank.

5. **Settings shows a working-looking button that does nothing** — tapping the billing button just says "coming soon". It should look inactive.

6. **Rows you can click cannot be reached by keyboard** on the performance, dealer and stock lists.

7. **Unused balance code left in the aging file** — old pre-GST helpers nobody calls any more. Dead weight that can be picked up by mistake later.

## Housekeeping the data is telling us (not code bugs)

- 315 orders dispatched but never billed, 43 products with unconfirmed GST rate, 18 offers still switched on past their end date, 15 returns open longer than two weeks, 60 dealers over their credit limit. These are seed-data conditions, but the app currently offers no easy "clean these up" path for the first three.
- The stock ledger only has movements from dispatches and adjustments — opening stock was seeded with no entry, so the history never explains the starting quantity.

## Fix order

Same loop as before: one item, then typecheck, tests, build, then check it signed in on real seed data, then the next.

1. Return preview shows GST-inclusive credit (and the pre-tax figure beside it).
2. Retire the stale stored payment flag so exports use real receipts.
3. Paging resets on filter and search change, not just on count change.
4. Settings billing button rendered as inactive.
5. Keyboard access on clickable rows.
6. Remove dead aging helpers.
7. Backfill the two missing dispatch dates from their delivery dates.

## Technical notes

- Item 1: `src/pages/Claims.tsx` `returnValue` sums `qty x unitPrice` only; compute tax per line from the invoice line's `gst_rate` so the preview matches `record_return_and_credit_atomic`.
- Item 2: `orders.payment_status` is written in `useOrdersDomain.ts` (book as `pending`, update path). Stop writing it and switch remaining export paths to `paymentStatusByOrder`; a one-time data correction sets stored flags from posted receipts.
- Item 3: `src/hooks/use-pagination.ts` resets on `totalItems` only; add a caller-supplied reset key and pass filter/search state at each call site.
- Item 7: one-time data update for the two orders; no schema change.

Out of scope, unchanged: money formulas, how bills are raised, stock movement rules, business rules, offline mode.
