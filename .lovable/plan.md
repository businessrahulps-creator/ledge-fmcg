# Fix money tracking and turn Billing into the money desk

## What I found

1. **Money can only be recorded after a bill exists.** Every receipt is tied to an invoice, and an invoice is only created at dispatch. A 50% advance at order time has nowhere to go.
2. **The payment mode and status picked while booking are only labels.** They never become a receipt, so nothing adds up to a real balance.
3. **Mixed payments (part UPI, part cash) work in principle** — each receipt carries its own mode — but only after billing, and the order never shows Total / Received / Still due before that.
4. **The Invoices page is a dead end.** Download PDF and WhatsApp share only. No on-screen preview, no paid/due figures, no way to record a payment, no link into the bill's order.
5. **Bills are locked on purpose** (GST numbering and audit trail). A wrong bill must be corrected with a credit note, and today that can only be started from Returns — nobody would look there.

## The approach

The bill is always raised in full. Accounts records money against it as it arrives — before or after the bill. Billing stops being an archive and becomes the place the accounts person lives in all day.

## 1. Billing → a real money section

Three tabs on one page, sharing one filter bar (dealer, date range, search):

**Collections** (opens here)
- Every bill with **Total · Received · Still due · Days overdue**, newest overdue first.
- Top strip: Total billed, Collected, Outstanding, Overdue.
- Row actions: **Record payment**, **Preview bill**, **Open order**, **Remind on WhatsApp**.
- Filters: Unpaid / Part-paid / Paid, and Overdue only.

**Payments**
- A running list of every receipt taken — date, dealer, bill, amount, mode, reference, who recorded it.
- Filter by mode and date; export to Excel and PDF for the accountant.
- Cancelled receipts stay visible, struck through, with reason.

**Documents**
- Today's archive: all bills and credit notes, with preview and download.

**Per-dealer view** — from any row, open a dealer statement: all bills, all payments, running balance, one **Send statement** action.

## 2. One Money box on every order, from the moment it's booked

- Shows **Total · Received · Still due** with a single **Record payment** button.
- Amount, mode (cash / UPI / bank / cheque), date, reference, note. Several receipts of different modes are normal.
- Payments taken **before** dispatch stay on the order and are **automatically counted against the bill** when it's raised — nothing re-entered.
- Paid / Part-paid / Unpaid is derived from receipts, never typed. The old typed status becomes read-only history.
- Guards: no overpayment, no future dates, cancelling a receipt needs a reason and stays on record.

## 3. Correcting a wrong bill

One action on the bill: raise a **full credit note** and reopen the order so it can be dispatched and billed again correctly. Original bill stays in the archive marked cancelled. No in-place editing — that would break GST numbering.

## 4. Same number everywhere

Orders list gets **Still due** plus a Collect action; dealer pages, reminders and WhatsApp text all read the same balance.

## Technical notes

- `invoice_payments` gains nullable `invoice_id` plus `order_id`, with a check that exactly one anchor is set; index on `order_id`; `posted_by` surfaced as "recorded by".
- New `record_order_payment_atomic(order_id, ...)` mirroring the invoice RPC — tenant check, row lock, idempotency key, overpayment guard.
- `dispatch_and_bill_order_atomic` re-points posted order-level receipts onto the new invoice in the same transaction.
- A canonical balance view (`invoice_id`, billed, received, due, days overdue) read by Billing, Orders, dealer pages and WhatsApp, so one figure everywhere.
- New `cancel_invoice_and_reopen_order_atomic`: full credit note through the existing credit-note sequence, stock restored only if goods came back, order returned to a re-billable state.
- Invoice preview reuses `GstInvoicePdf` in a viewer — no second bill template.
- `PaymentsPanel` generalised to accept an order or an invoice; opened as a sheet from Billing rows too.
- Exports go through the existing XLSX/PDF footer helpers.
- Tests: partial then final payment, mixed modes, pre-bill advance carried onto the bill, overpayment rejection, void restoring balance, ageing buckets, cancel-and-rebill leaving clean GST records.

## Order of work

1. Database: payment anchors, order-payment RPC, bill-time re-pointing, balance view.
2. Money box on the order, from booking onwards.
3. Billing rebuilt: Collections, Payments, Documents, dealer statement.
4. Correct-a-bill flow.
5. Balance surfaced in Orders list, dealer pages, WhatsApp.
