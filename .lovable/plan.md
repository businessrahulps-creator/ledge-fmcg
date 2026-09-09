# Take money any time — one simple Money box on every order

Right now money can only be recorded after the bill is raised, and it lives in a separate panel below the order. Real life is the other way round: the dealer sends ₹2,000 on UPI today, you dispatch three days later, the rest comes a week after that. This plan makes the app follow that reality.

## The rule we are building

**Every order has one Money box. You can put money in at any time — before dispatch, at dispatch, or weeks later. The app always shows three numbers: Total, Received, Balance.**

Nothing else changes about how orders, bills or stock work.

```text
Book order  ₹3,200        Money box:  Total 3,200 · Received 0 · Balance 3,200
   |
Dealer sends ₹2,000 UPI → tap "Record payment" → Received 2,000 · Balance 1,200
   |
(2-3 days later) Dispatch & bill → bill is raised for ₹3,200
   |               the ₹2,000 already received is carried onto the bill automatically
   |               bill shows "Part paid — ₹1,200 due"
Dealer sends ₹1,200 → tap "Record payment" → Balance 0 · order marked Paid
```

## What you will see

**On an order (before or after dispatch)**
- A single green Money box at the top of the order, with the three numbers and one big button: **Record payment**.
- The payment form asks only: how much, how (Cash / UPI / Bank / Cheque), on what date, and an optional reference number. Amount is pre-filled with the balance, so full payment is two taps.
- Underneath, every receipt is listed with date, mode and amount. A receipt is never edited or deleted — if it was a mistake you cancel it with a reason, and the cancelled line stays visible.
- The old "payment status" dropdown disappears. Paid / Part paid / Unpaid is decided by the money actually received — you never set it by hand.

**When you dispatch and bill**
- Money already collected against the order is automatically attached to the new bill. No re-entry, no double counting.
- If the whole amount was already paid, the bill is created as Paid.

**On the Orders list**
- A "Balance" figure on each row and a **Collect** button that opens the same payment form without leaving the list.
- A filter chip: **Money to collect** — every order with a balance, biggest and oldest first.

**On the dealer page and WhatsApp**
- The dealer's balance already exists; it will now include pre-dispatch money too, so it stays correct.
- The WhatsApp message for an order/bill ends with a plain line: `Paid ₹2,000 · Balance ₹1,200`.

**Wording changes (plain English)**
- "Record payment" instead of payment status editing
- "Received" and "Balance" instead of outstanding / partial / settled
- "Cancel this receipt" instead of void

## Safety

- The app never lets you record more than the balance, and never a future date.
- Recording money is one server action, so a double tap or a dropped connection cannot create two receipts.
- Cancelling a receipt is logged with who and why; the money history is a permanent record.
- Only people allowed to see money can record or cancel it. Everyone else sees the numbers read-only.

## Technical notes

- `invoice_payments` gains a nullable `order_id` and its `invoice_id` becomes nullable, so a receipt can exist against an order before a bill exists. A check constraint requires at least one of the two. `order_id` is backfilled from each invoice's `source_order_id`.
- New RPC `record_order_payment_atomic(p_order_id, p_amount, p_mode, p_paid_on, p_reference, p_note, p_idempotency_key)`: tenant + `see_money` capability check, locks the order, rejects amounts above the order balance (order total minus posted receipts) and future dates, inserts a posted receipt, recomputes `orders.payment_status`.
- `record_invoice_payment_atomic` keeps working; both paths recompute status from posted receipts minus credit notes.
- `void_invoice_payment_atomic` is extended to handle order-level receipts and recompute the order status.
- `dispatch_and_bill_order_atomic` gains a final step: attach the order's unlinked posted receipts to the new invoice (`invoice_id = v_invoice_id`), then set the invoice status to `paid` / `partial` from the received total. Credit-limit maths subtracts money already received.
- Canonical balance helper used by dealer aging and the dealer page is updated to count order-level receipts.
- `PaymentsPanel` is generalised into a `MoneyBox` component taking `{ orderId, invoiceId?, total }`, rendered on `OrderDetail` for every order, and reused in a sheet from the Orders list.
- `OrderDetail` loses the manual payment-status select and the credit-limit override tied to it; `NewOrder` keeps booking-only behaviour (no money field at booking — the Money box is one tap away on the order that was just created).
- Tests: RPC unit tests for over-payment, future date, idempotency, void recompute; a lifecycle test covering pay-part → dispatch → pay-rest → Paid; existing WhatsApp share tests extended with the balance line.

## Not in this change

- Advances not tied to any order (dealer wallet), refunds, and splitting one payment across several bills. Each payment belongs to one order.
