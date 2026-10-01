# India time everywhere, plus the open fixes and the screenshot bug

## 1. Screenshot: "Couldn't record this payment"
That order was cancelled. The system correctly refuses payments on cancelled orders, but the screen still shows "Record payment" and then a vague error.
- Hide "Record payment" on cancelled orders. Show "This order was cancelled, so payments can't be added" in its place.
- When the system refuses for a clear reason (cancelled order, amount too big, no permission), the message says that reason in plain words, not "Something went wrong".

## 2. India time (IST) everywhere
- Payment, return and credit note dates default to today in India, and the database checks dates against India time, not UK time. Between midnight and 5:30 am you get today's date, not yesterday's.
- Sweep the app for any remaining "today" built from UK time (orders, targets, offers, reports, exports, file names) and switch it to India time.
- Shown times and dates always say India time.

## 3. Returns can't be saved twice
A return filed twice because of a bad connection is saved once. The second try gets back the first result.

## 4. Numbers past 9,999
Bill, order and credit note numbers keep working past 9,999 in a year (they just get one more digit). Existing numbers don't change.

## 5. ₹1 left over on item-by-item returns
When the last item of a bill is returned, the credit note takes whatever is left, so nothing stays owed from rounding. Earlier credit notes don't change.

## 6. Opening stock in the stock history
Add one "Opening stock" line for every stock row that's missing one, so the history adds up to today's count. Counts don't change.

## Checks
- Try paying on a cancelled order in the demo business: no button, clear message.
- Test that a date at 00:30 India time saves as that day.
- Run all automatic tests and the type check. Printed GST bills are not changed.

## Technical details
- OrderDetail/PaymentsPanel: gate on `delivery_status`/`cancelled_at`; map known RPC exceptions (`This order was cancelled.`, overpay, capability) to user messages in handleSupabaseError.
- Migration: `record_*_payment_atomic`, `record_return_and_credit_atomic` use `(now() at time zone 'Asia/Kolkata')::date` for defaults and future-date checks; add `p_idempotency_key` to return RPC (new overload, unique index on credit_notes idempotency).
- Sequence format: `lpad(seq, greatest(4, length(seq)))`.
- Final-line return: credit = remaining invoice balance for that line.
- Backfill opening `stock_movements` (movement_type 'opening', delta = quantity − sum of movements) via data query.
- Replace `toISOString().slice(0,10)` with `todayKey()`/`istDateKey()`.
