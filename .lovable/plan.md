# The money isn't wrong — the labels are

I checked this order in the database:

- Order value (before GST): ₹66,080
- GST on it: ₹11,894
- Bill ABD-INV-2026-0008 total: ₹77,974
- Two payments received: ₹20,000 + ₹57,974 = ₹77,974

So the dealer paid exactly the bill, nothing more. The ₹0 balance is right. The problem is that the big card shows the pre-GST order value next to a payment figure that includes GST, so it reads like an overpayment.

## 1. Show the bill amount once a bill exists

- First figure becomes **Bill total** ₹77,974, with a small line under it: "₹66,080 + ₹11,894 GST".
- **Money received** and **Balance to collect** stay as they are — they already compare against the bill.
- Before a bill exists (order just booked), nothing changes: **Order total** plus any advance received.

## 2. The "Invoice" button on this page — your question

You're right to be suspicious. That button doesn't open the real bill. It builds a separate order-based document from the order value (₹66,080, no GST breakdown), which means two different "invoices" exist for the same sale. That's confusing and, for a GST business, risky.

My recommendation:

- **Once the order is billed:** the button becomes **Bill** and opens the real GST bill ABD-INV-2026-0008 (₹77,974) — the same preview and download already used on the money desk. One official document, nowhere else.
- **Before dispatch (no bill yet):** it becomes **Order confirmation** and clearly says "Not a tax invoice", so a sales person can still send a dealer the order copy without it looking like a bill.

WhatsApp share and print keep working, just pointing at the correct document.

## 3. Same check elsewhere

I'll verify the Orders list, dealer pages and money desk show the bill amount (with GST) once an order is billed, so one number follows the order everywhere.

## Technical notes

- `src/pages/OrderDetail.tsx`: hero tile driven by `hasBill` — `finalInvoice.grandTotal` with taxable + tax subline instead of `netTotal`. Balance maths already uses `moneyTarget`, unchanged.
- Invoice button: when `finalInvoice` exists, open `InvoicePreviewDialog` / `GstInvoicePdf` for that invoice; otherwise keep `OrderInvoicePdf` relabelled as an order confirmation with a "Not a tax invoice" line.
- No database, RPC or receipt changes; documents stay immutable.
