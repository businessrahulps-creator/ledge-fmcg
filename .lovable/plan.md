# The money isn't wrong — the label is

I checked this order in the database:

- Order value (before GST): ₹66,080
- GST on it: ₹11,894
- Bill ABD-INV-2026-0008 total: ₹77,974
- Two payments received: ₹20,000 + ₹57,974 = ₹77,974

So the dealer paid exactly the bill, nothing more. The balance of ₹0 is right. The problem is that the big card shows the pre-GST order value next to a payment figure that includes GST, so it reads like an overpayment.

## The fix

Once a bill exists, the card should talk about the bill, not the pre-GST order value:

- First figure becomes **Bill total** ₹77,974, with a small line under it: "₹66,080 + ₹11,894 GST".
- **Money received** and **Balance to collect** stay as they are — they already compare against the bill.
- Before a bill exists (order just booked), nothing changes: it keeps showing **Order total** and any advance received.

I'll also check the same order value vs bill value mix-up on the Orders list, the dealer page and the money desk, and make them all show the bill amount once an order is billed, so one number follows the order everywhere.

## Technical notes

- `src/pages/OrderDetail.tsx`: hero tile label/value driven by `hasBill` — use `finalInvoice.grandTotal` with a taxable + tax subline instead of `netTotal`. Balance maths already uses `moneyTarget`, unchanged.
- No database, RPC or receipt changes. Display only.
