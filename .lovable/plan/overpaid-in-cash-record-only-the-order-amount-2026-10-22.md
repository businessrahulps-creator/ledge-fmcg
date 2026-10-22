# Overpaid in cash: record only the order amount

## What happens today
On the new order form, if the advance is more than the order and the person picks **Give the extra back**, Ledge saves the **full amount** as received. The order is marked Paid, and the extra goes on a separate "To give back" entry that waits until someone taps **Mark given back**.

With cash this doesn't match what happens at the counter. The dealer hands over ₹6,000 for a ₹5,617 order, the staff gives ₹383 change right away, and only ₹5,617 is actually kept. Ledge should save ₹5,617.

The dealer's unpaid amount is already right today, because the "to give back" money is not counted. The bug is in the payment record and the cash total: they show ₹6,000 received plus a pending refund nobody needs.

## The fix
1. **Cash + Give the extra back** — the choice reads **"Give change now"**. Ledge saves only the order amount as the payment. The note says "Cash received ₹6,000, change given ₹383", so it still shows in Activity and on the order. Nothing is left as "To give back".
2. **UPI / bank / cheque + Give the extra back** — no change: full amount saved, extra shown as "To give back" until **Mark given back** (the money really did arrive in the bank).
3. **Use for other bills / Keep as dealer credit** — no change for any payment method. The full amount is kept, so the full amount is saved.
4. The same rule applies to the **Record payment** box on an order or bill page, so cash overpayments behave the same everywhere.
5. Before saving, the form shows a clear line: "Saving ₹5,617 · give ₹383 change".

## Technical details
- `src/pages/NewOrder.tsx` and the record-payment dialog: when `mode === 'cash'` and the choice is `refund`, send `amount = bill equivalent` (order) or the balance due (bill), `extraAction = null`, and a note with the tendered amount and the change. Relabel the card for cash.
- Server guard in `record_order_payment_atomic` / `record_invoice_payment_atomic`: refuse `extraAction='refund'` when the mode is cash (message: "Give cash change at the counter"), so no client can save a cash refund_due entry. Existing refund_due rows stay as they are.
- Add a small pure helper `splitCashOverpay(tendered, due)` that returns `{ save, change }`, with vitest cases (6000/5617 gives 5617/383; exact pay gives 0 change; underpay keeps the full amount).
- Run the full test suite, then try it once on a real order in the preview.
