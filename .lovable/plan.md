# Fix money tracking and make Invoices a real page

## What I found

1. **Money can only be recorded after a bill exists.** Every receipt in the database is tied to an invoice, and an invoice is only created at dispatch. So if a dealer pays 50% at order time, there is nowhere to put it.
2. **The payment mode and status picked while booking are only labels.** They never become a receipt, so nothing adds up to a real balance.
3. **Mixed payments (part UPI, part cash) work in principle** — each receipt carries its own mode — but only after billing, and the order never shows Total / Received / Still due before that.
4. **The Invoices page is a dead end.** Download PDF and WhatsApp share only. No on-screen preview, no paid/due figures, no way to record a payment, no link into the bill's order, no way to correct a wrong bill.
5. **Bills are locked on purpose** (GST numbering and audit trail). A wrong bill must be corrected with a credit note, and today that can only be started from Returns — which is not where anyone would look.

## What we build

The bill is always raised in full. The accounts team records money against it as it comes in — before or after the bill.

### 1. One Money box on every order, from the moment it's booked

- Shows **Total · Received · Still due** with a single **Record payment** button.
- Each payment captures amount, mode (cash / UPI / bank / cheque), date, reference, note. Several payments of different modes are normal.
- Payments taken **before** dispatch stay attached to the order and are **automatically counted against the bill** the moment it's raised — nothing to re-enter.
- Paid / Part-paid / Unpaid is worked out from the receipts themselves, never typed in. The old typed-in payment status becomes read-only history.
- Guards stay: no overpayment beyond the order or bill total, no future dates, cancelling a receipt needs a reason and leaves the record visible.

### 2. Invoices page becomes usable

- **Preview** — open the bill on screen in a viewer before downloading or sending.
- **Paid / Still due columns** plus a "Money owed" total at the top.
- **Record payment** directly from the row, same box as the order.
- **Open the linked order** in one tap.
- **Unpaid only** filter, and search by dealer or number as today.
- **Correct a bill** — one action that raises a full credit note against the bill and reopens the order so it can be dispatched and billed again correctly. The original bill stays in the archive, marked cancelled. No in-place editing of a raised bill.

### 3. Money visible where people look

- Orders list gets a **Still due** column and a Collect action.
- Dealer page shows the same balance figure everywhere, from receipts.
- WhatsApp reminder text uses the same balance.

## Technical notes

- `invoice_payments` gains a nullable `invoice_id` plus `order_id`, with a check that exactly one anchor is present; index on `order_id`.
- New `record_order_payment_atomic(order_id, ...)` mirroring the existing invoice RPC — tenant check, row lock, idempotency key, overpayment guard.
- `dispatch_and_bill_order_atomic` re-points posted order-level receipts to the new invoice inside the same transaction.
- Canonical balance helper used by orders, invoices, dealer pages and WhatsApp, so one number everywhere.
- New `cancel_invoice_and_reopen_order_atomic`: full credit note via the existing credit-note sequence, stock restored only if goods came back, order returned to a re-billable state.
- Invoice preview reuses the existing `GstInvoicePdf` in a viewer — no second bill template.
- `PaymentsPanel` generalised to accept either an order or an invoice; UI unchanged.
- Tests: partial then final payment, mixed modes, pre-bill advance carried onto the bill, overpayment rejection, void restoring balance, cancel-and-rebill leaving clean GST records.

## Order of work

1. Database: payment anchors, order-payment RPC, bill-time re-pointing.
2. Money box on the order, from booking onwards.
3. Invoices page: preview, paid/due, record payment, order link, unpaid filter.
4. Correct-a-bill flow.
5. Balance shown in Orders list, dealer pages, WhatsApp.
