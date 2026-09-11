# Money tracking: fix the gaps and turn Billing into the money desk

I checked this against the live database functions before writing it. Findings and fixes below.

## What I found (verified)

1. **Money can only be recorded after a bill exists.** Receipts must point at an invoice, and an invoice is only created at dispatch. A 50% advance at order time has nowhere to go.
2. **The payment mode and status picked while booking are only labels.** They never become a receipt, so nothing adds up.
3. **Two different "outstanding" figures exist.** The credit-limit check at dispatch already works out the correct balance from bills minus receipts minus credit notes. But the dealer figure shown on dealer cards, Orders and My Business is the older rollup: it counts a **delivered** order's full value as outstanding even when part-paid, and counts a billed-but-not-yet-delivered order as zero. So the app can show a dealer owing nothing while the credit check blocks their next bill.
4. **The Invoices page is a dead end.** Download PDF and WhatsApp only — no preview, no paid/due, no way to take money, no link to the order.
5. **Bills are locked on purpose** (GST numbering, audit trail). Correcting one needs a credit note, and that can only be started from Returns today — nobody would look there.

## The approach

The bill is always raised in full. Accounts records money against it as it arrives — before or after the bill. Billing becomes the place the accounts person works from all day.

## 1. Billing → a real money section

Three tabs, one shared filter bar (dealer, date range, search):

**Collections** (default)
- Every bill with **Total · Received · Still due · Days overdue**, most overdue first.
- Top strip: Billed, Collected, Outstanding, Overdue.
- Row actions: Record payment · Preview bill · Open order · Remind on WhatsApp.
- Filters: Unpaid / Part-paid / Paid, Overdue only.

**Payments**
- Every receipt taken: date, dealer, bill, amount, mode, reference, who recorded it.
- Filter by mode and date; export to Excel and PDF through the existing footer.
- Cancelled receipts stay visible, struck through, with the reason.

**Documents**
- Today's archive of bills and credit notes, now with on-screen preview.

**Dealer statement** — from any row: all bills, all payments, running balance, one Send statement action.

## 2. Money box on every order, from the moment it's booked

- **Total · Received · Still due** with one **Record payment** button.
- Amount, mode (cash / UPI / bank / cheque), date, reference, note. Several receipts of different modes are normal.
- Payments taken **before** dispatch stay on the order and are counted against the bill automatically once it's raised.
- Paid / Part-paid / Unpaid is derived from receipts, never typed.

## 3. One outstanding figure everywhere

Dealer balance is recomputed from bills minus posted receipts minus credit notes — the same rule the credit-limit check already uses. Dealer cards, Orders, My Business credit-at-risk, reminders and WhatsApp all read that one number.

## 4. Correcting a wrong bill

One action on the bill: raise a full credit note and reopen the order so it can be dispatched and billed again correctly. The original stays in the archive marked cancelled. No in-place editing.

## Technical notes

- `invoice_payments`: `invoice_id` becomes nullable, add `order_id`, check that exactly one anchor is set, index on `order_id`. Existing rows are unaffected.
- New `record_order_payment_atomic(order_id, …)` mirroring `record_invoice_payment_atomic` — company check, `see_money` capability, `FOR UPDATE` lock, idempotency key, over-collection guard against the order total, future-date guard.
- `void_invoice_payment_atomic` extended to handle order-anchored receipts (currently assumes an invoice row).
- `dispatch_and_bill_order_atomic` re-points posted order-anchored receipts onto the new invoice inside the same transaction, then sets invoice/order status from the resulting balance. The existing credit-limit block is left exactly as it is.
- `refresh_entity_aggregates` outstanding branch replaced with the bills-minus-receipts-minus-credit-notes rule, plus triggers on `invoice_payments`, `invoices` and `credit_notes` so the dealer figure moves when money moves. One-off backfill for existing dealers.
- New `cancel_invoice_and_reopen_order_atomic`: full credit note through the existing `credit_notes` sequence and `document_sequences`, stock restored only if goods came back, order returned to a re-billable state.
- Invoice preview reuses `GstInvoicePdf` in a viewer — no second bill template.
- `PaymentsPanel` generalised to take an order or an invoice; also opens as a sheet from Billing rows.
- Frozen-document policies from Phase 5 stay intact; all writes keep going through RPCs.
- Tests: partial then final payment, mixed modes, pre-bill advance carried onto the bill, over-collection rejection, void restoring balance, dealer outstanding matching the credit-limit figure, ageing buckets, cancel-and-rebill leaving clean GST records.

## Order of work

1. Database: payment anchors, order-payment RPC, bill-time re-pointing, corrected dealer outstanding + backfill.
2. Money box on the order, from booking onwards.
3. Billing rebuilt: Collections, Payments, Documents, dealer statement.
4. Correct-a-bill flow.
5. Balance surfaced in Orders list, dealer pages, My Business, WhatsApp.
