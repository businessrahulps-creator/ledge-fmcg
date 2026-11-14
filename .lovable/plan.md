# Mark Delivered – Actual Delivery Date

## What the user will see
- Clicking **Mark delivered** opens a small window instead of saving straight away.
- **Delivery date**: defaults to today; earlier dates allowed; future dates and dates before the sent date (or order date if not sent) are greyed out, with a plain message if typed anyway.
- **Delivery note** (optional): receiver name or remarks.
- **Cancel** closes with no change. **Confirm delivery** saves; the button shows "Saving…" and can't be pressed twice.
- After saving, the order journey's Delivered step and the facts strip ("Delivered on: 12 Nov 2026") show the same saved date.

## What stays the same
- Same delivery save step on the server, same status rules, permissions and Activity history.
- Existing sent-remarks are kept: the note is added on a new line, never replaces them (the server already does this).
- Sales Targets and Delivered Revenue already count by the saved delivery date, so backdated deliveries land in the right day/month automatically.
- No change to billing, sending, orders list or reports.

## Technical details
- `useOrdersDomain.markDelivered(orderId, deliveredOn?, note?)`; `data-types.ts` and `services/api.ts` updated to match. Date `YYYY-MM-DD` sent as `${d}T12:00:00+05:30` (IST noon) so the calendar day never shifts.
- Small DB update to `mark_order_delivered_atomic` (same signature): refuse a date later than today IST or earlier than the dispatch/order date IST — so the rule holds even if the screen is bypassed. Nothing else in the function changes.
- `OrderDetail.tsx`: new dialog using existing Dialog + date input with `min`/`max`; `savingRef` guard; journey step and facts strip read `order.deliveredAt` via `formatIndianDate`.
- Pure helper `deliveryDateBounds(order, today)` + `validateDeliveryDate` in `src/lib/delivery-date.ts` with tests: today default, backdate ok, future blocked, before-dispatch blocked, falls back to order date, IST conversion keeps the day.
- Server checks run in a self-rolling-back test (future refused, before-dispatch refused, valid backdate saved, note appended to existing remarks).

## Files
`src/pages/OrderDetail.tsx`, `src/context/domains/useOrdersDomain.ts`, `src/context/data-types.ts`, `src/services/api.ts`, new `src/lib/delivery-date.ts` + test, one migration for `mark_order_delivered_atomic`.
