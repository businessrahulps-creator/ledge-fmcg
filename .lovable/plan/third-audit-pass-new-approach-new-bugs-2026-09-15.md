# Third audit pass — new approach, new bugs

This round looked at failure paths instead of happy paths: edge inputs, rounding, date
boundaries, printed documents, and what the app itself has been recording in its own
error log. It found one serious money bug that the earlier passes missed.

## 1. Scheme discounts are being deducted twice (serious)

When an order with a scheme discount is saved, the order value stored in the books is
**already after** the discount. Almost every screen then subtracts the discount a second
time.

What this means for you: an order worth ₹74,820 after a ₹3,741 scheme discount shows up
as ₹71,079 in dashboards, targets, reports and printed statements. Revenue is understated,
target attainment looks worse than it is, and dealer and sales-person statements print an
amount the dealer never agreed to.

It also affects money owed: on an order page that has not been billed yet, "still due" is
calculated from the twice-discounted figure, so the balance shown is too low.

Where it shows up: Dashboard, Performance, My Business, Targets, Orders list, order page,
dealer page, sales-person page, Payment / Dealer / Sales team / Dispatch reports, the order
confirmation PDF and the dealer and sales-person statement PDFs.

Fix: one shared rule — the stored order value is final. Remove the second subtraction
everywhere, keep showing the discount as a separate line so people can still see what was
given away. The old seeded orders were saved under the opposite rule, so a one-time
correction will bring them onto the same footing before the change goes live.

## 2. A payment larger than the balance can be typed in

The record-payment box only refuses zero and negative amounts. Nothing warns when the
amount typed is more than what is still due on that bill or order.

Fix: warn clearly when the amount exceeds the balance and ask for confirmation before
posting, so a mistyped extra zero is caught at entry instead of turning up later as a
credit nobody expected.

## 3. Orders can be booked for more stock than exists

New Order shows "only 12 available" as a note but still lets the order through with no
acknowledgement. Dispatch then fails later with a stock error, after the dealer has been
told the order is placed.

Fix: keep booking possible (pre-orders are normal), but make the person confirm they are
booking ahead of stock, and show it on the order page so dispatch day holds no surprises.

## 4. Weekly periods can drop their last day

Weekly target periods on Performance, the dealer page and the sales-person page build
their end date in a way that can slip back by one day depending on the device clock, so
the final day's orders can fall outside the week.

Fix: use the same date handling used elsewhere in the app, so the period always covers the
days it names.

## 5. The app's error record is full of its own routine notes

Of 709 unread entries, 664 are routine information — "loading in pages" notes and
reconnect retries — written on every session. Real failures are buried and the table grows
for no reason.

Fix: keep routine notes in the browser console only; record to the error list what is
actually a failure. Clear the accumulated noise.

## 6. Rounding on older bills

362 older seeded bills have a total rounded to the rupee while the rounding difference is
recorded as zero, so the lines add up to a few paise more than the total. Bills raised by
the app today record the difference correctly.

Fix: a one-time correction on the seeded bills so exports reconcile to the paisa. No change
to how bills are raised.

## 7. Small ones

- One delivered order is dated as delivered before it was dispatched; correct the dates.
- One dispatched order has no stock movement recorded behind it (seed artefact); log a
  matching opening entry so the stock ledger balances.

## What stays untouched

Money formulas beyond the double-discount fix, how bills are raised, GST calculation,
stock movement rules, business rules, and offline mode.

## Working method

Same loop as before: one item at a time, then type check, the full test suite, a clean
build, and a signed-in check in the browser on real seeded records before moving on.

## Technical notes

- `book_order_atomic` stores `orders.total = GREATEST(gross - scheme_savings, 0)`;
  `netTotal()` in `src/lib/revenue.ts:4` subtracts again, as do local copies in
  `Orders.tsx:163`, `OrderDetail.tsx:392` (feeds `moneyTarget`/`balance`),
  `DealerDetail.tsx:442`, `SalespersonDetail.tsx:201`, `dealerScorecard.ts:48`,
  `salespersonScorecard.ts:61`, `OrderInvoicePdf.tsx:48`, `DealerStatementPdf.tsx:43`,
  `SalespersonStatementPdf.tsx:45`, `command-signals.ts:71`. `credit-exposure.ts` computes
  from raw lines and is already correct.
- Legacy seeded orders (449 rows, `RAW-*`) store gross; migrate them to
  `sum(line_total) - scheme_savings` in the same change so one convention holds.
- `PaymentsPanel.tsx:99` bounds check; `NewOrder.tsx:208-227` stock warning is non-blocking.
- `Performance.tsx:927`, `DealerDetail.tsx:440`, `SalespersonDetail.tsx:199` use
  `toISOString().split("T")[0]` on locally built dates.
- `data-utils.ts:193-202` writes `severity: "info"` pagination rows to `error_log`; realtime
  retries do the same.
