# Fix the order flow: one form to book, one page to run the order

## What is wrong today (checked against the live order you have open)

The order you are viewing, ABD-2026-0554, is genuinely **not dispatched** in the database. The page just reads as if it were:

- The progress line shows "Dispatched — Now", which reads like it already went out.
- A big "Status & Dispatch" card sits open with Dispatch Date, Vehicle and Driver boxes, so it looks like the order has shipping details.
- The facts row shows "Payment mode: Cash" even when nobody has paid anything — that value is just a leftover default.

Beyond the misread, the two screens contradict each other:

- **New Order** collects dealer, sales person, products, warehouse, notes. Nothing about money.
- **Order Detail** is really a second, fuller edit form — you can change dealer, sales person, items, warehouse, vehicle, driver, dispatch date, payment mode — and it is all open for editing even after the bill is raised. There is a "Save Changes" button that quietly saves a mix of things that belong to very different moments.
- Payment mode is asked twice: once as a big button grid on the order (which means nothing), and again correctly inside each payment you record.

## The answer to your question about the two forms

Vehicle, driver and dispatch date should **not** move into New Order. Nobody knows the truck at booking time. They belong to the moment goods leave, so they move **into the Dispatch & bill step**, where you type them once and they are captured on the bill.

What is genuinely missing from New Order is **money**: most dealers pay something upfront. That goes in.

## What each screen becomes

### New Order — book the order
1. Order details: date, dealer, sales person (unchanged)
2. Products (unchanged, with schemes and stock warnings)
3. Ships from + notes (unchanged)
4. **New: Advance received (optional)** — amount, mode (cash/UPI/bank/cheque), reference. Recorded against the order, and it attaches itself to the GST bill automatically when you dispatch.
5. A one-line footer that sets expectations: "Booking holds the order. Stock and the GST bill happen when you dispatch."

### Order Detail — run the order, read first
Top to bottom, in the order a person actually needs it:

1. Money box: order total, received, still due, plus **Record payment** (already working)
2. Progress line with honest wording: "Dispatched — Not sent yet" when nothing has shipped
3. Facts: dealer, sales person, items, order date, warehouse — plain text, no dropdowns
4. Items — plain read-only table
5. Next action, one clear button depending on where the order stands:
   - Not sent yet: **Dispatch & bill** (opens the stock preview, then asks for dispatch date, vehicle, driver and warehouse in the same dialog)
   - Dispatched: **Mark delivered**
   - Delivered: **Record return**
6. Documents (bill and credit notes), then history

Editing moves behind a single **Edit order** button:
- Before dispatch: opens the same fields as New Order (dealer, sales person, items, warehouse, notes) with Save / Cancel
- After dispatch or billing: edit is off, with a line explaining that the bill is final and corrections go through a return / credit note

Removed from the page: the payment-mode button grid, the always-open Status & Dispatch card, and the ambiguous "Save Changes" bar.

## Technical notes

- No database or RPC changes. `book_order_atomic`, `dispatch_and_bill_order_atomic`, `record_order_payment_atomic`, `mark_order_delivered_atomic` and `record_return_and_credit_atomic` all stay as they are.
- Advance at booking = call `record_order_payment_atomic` right after `book_order_atomic` returns the order id, with the existing idempotency key pattern from `PaymentsPanel`. Failure of the receipt must not lose the booked order — show a toast and let the user record it on the order page.
- Dispatch dialog gains dispatch date / vehicle / driver / warehouse inputs; those values are passed straight into `dispatchAndBill` (already supported by its options object) instead of living in page state.
- `OrderDetail` splits into a read view plus an `OrderEditSheet` reusing the line-item editor; existing `updateOrder` path is kept for pre-dispatch edits only.
- Journey step wording fix in `OrderDetail`; `JourneyTrack` keeps its API.
- Delete, WhatsApp, PDF, EntityHistory, capability checks (`see_money`, `manage_stock`, `override_credit_limit`) and the credit-limit override dialogs stay exactly as they are.
- Existing visual language (HeroBand, glass-card, StatusBadge, semantic tokens) unchanged.
- Order lifecycle e2e specs updated for the new dispatch dialog fields; typecheck, Vitest and build run before hand-off.
