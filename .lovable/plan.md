# Fourth audit pass: what the re-test found

The money core is clean again. All 110 dealer balances match to the rupee, every bill's
lines add up to its total, no bill or order number is duplicated, no payment is missing its
link, no stock is negative, no return exceeds what was dispatched, no cancelled order has a
bill, and no bill has been over-received.

Six new problems came out of this round.

## 1. 117 bills show a green "Paid" badge although no money came in

Worth ₹1.44 crore. These are older seeded bills carrying a stale "paid" marker from before
the receipt system existed. The Money to Collect figures are right — they are worked out
from actual receipts — so only the badge lies, but someone scanning the Documents list will
believe those dealers have settled.

Same class of problem as the order payment flag fixed last round; bills were missed.

Fix: the badge reads from actual receipts, and a one-time correction puts the stored marker
back in line. Also add the missing "Part paid" wording — bills that are half-collected
currently read "Issued", which tells the user nothing.

## 2. Exported money columns are text, not numbers

In the downloaded To collect and Payments sheets, amounts and dates arrive as plain text, so
they cannot be summed, sorted or filtered in Excel. The formatting the export was built to
apply is never actually applied.

Fix: write amounts as numbers and dates as dates, with rupee and date formats.

## 3. The payments PDF hides cancelled payments

The Excel sheet marks a cancelled payment as "Cancelled" and shows its reference. The PDF of
the same list drops both columns, so a cancelled payment reads as real money received.

Fix: the PDF carries the same reference and status columns.

## 4. Returns let you type a quantity that will be refused

When part of a line was already returned earlier, the return form still allows up to the
full original quantity. The server correctly refuses it, but only after Save, as a raw
message. Nothing on screen says how much is already returned.

Fix: cap each line at what is still returnable and show "N already returned".

## 5. Blank-screen crashes recorded on Money to Collect and Dashboard

Fourteen crash records, the most recent today, all pointing at a hook-order problem rather
than data. Some are from the removed bill viewer page and are historical. The cause is not
confirmed yet, so step one is to reproduce it in the browser before changing anything.

## 6. Small ones

- 2 targets saved with both a revenue and an order goal of zero.
- 1 team invitation still shows as pending after expiring.
- 2 dealers have no GST number recorded.

## Housekeeping (data, not defects)

315 dispatched orders never billed, 43 products with unconfirmed GST rate, 18 expired
schemes still switched on, 17 open returns, 60 dealers over their credit limit, 46 items
below their stock threshold. These need a person's decision, not a code change.

## What stays untouched

Money formulas, how bills are raised, GST calculation, stock movement rules, business rules,
offline mode.

## Technical notes

- Badge source: derive from `invoice_payments` (posted) and `credit_notes` against
  `invoices.grand_total`, same rule as `dealer_balances`; extend `billStatusView` in
  `src/lib/bill-status.ts` to handle `partial`. One-time SQL aligns `invoices.status`
  (`paid` / `partial` / `posted`) — the `tg_sync_invoice_paid_state` trigger keeps new ones
  correct already.
- `src/utils/exportXlsx.ts`: call the existing `isCurrencyCol` / `isDateCol` helpers in
  `buildWorksheet`, write typed cells (`t:"n"` with `z` formats), add unit tests.
- `src/pages/Billing.tsx:794-800`: PDF column list matches the Excel headers.
- `src/pages/Claims.tsx:209-217, 330-349`: fetch prior `credit_note_lines` per invoice line,
  cap `max` at `billed − already returned`, show the remaining figure inline.
- Crash: reproduce `/billing` and `/dashboard` via Playwright, check hook order in
  `Billing.tsx` around the loading early return and in `useCollections`; clear stale
  `/bill/:id` records afterwards.
- Verification loop per item: `npx tsgo --noEmit` → 271 Vitest → build log → signed-in
  browser check on real seeded rows.
