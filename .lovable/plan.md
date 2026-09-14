# Audit and clean-up of the order-to-money flow

## What is working correctly

- New Order books the order, with Advance received as an optional extra.
- Opening an order shows total, money received, balance to collect, and whether it is dispatched and billed.
- Dispatch creates the real GST bill; money recorded before dispatch attaches itself to that bill.
- Money to collect lists every bill with what has come in and what is still due.

So the flow itself is right. What is wrong is how a few things are labelled and how a few buttons behave.

## Problems found, and the fix for each

### 1. Preview bill does nothing (Chrome blocks it)

The bill is built in the browser and shown inside a small embedded window. Chrome often refuses to show a PDF that way, so the panel comes up blank or blocked.

Most reliable answer: open the bill in a new browser tab, which uses Chrome's own PDF viewer and never gets blocked.

Fix:
- "View bill" opens the finished bill in a new tab.
- Inside the app the preview window stays, but with Download and Open in new tab always visible, and an honest line if the browser refuses to display it.
- The bill is built before the tab opens, so no empty tab appears if something fails.

### 2. Icons in Money to collect are hard to read

Each row currently shows four small icons with no words.

Fix: one worded main button, **Record payment**, plus a three-dot menu holding View bill, Open order and Remind on WhatsApp. Fully paid rows show View bill as the main button instead. Phone cards get the same treatment.

### 3. "Order confirmation" PDF

This is kept, and stays available only before the order is billed. It gets clearer wording so nobody mistakes it for a tax bill:
- Button reads "Order confirmation (not a bill)".
- The sheet header says clearly that it is an order confirmation and not a tax invoice, and the amount is labelled "Order value — GST added at billing".
- Once the order is billed, this button disappears and only the real GST bill remains, exactly as it does today.

### 4. Wording that still contradicts itself

- Money to collect column "Total" becomes "Bill total" so it can never be confused with the pre-GST order value.
- Payments tab: each row says plainly whether the money sits against a bill or against an order not yet billed.
- Cancelled receipts stay visible, struck through, with the reason — they are never hidden.

### 5. Small correctness checks in the same pass

- An order that already has money against it cannot be deleted (already enforced) — the greyed-out button gets a short line saying why.
- Balance figures on the order page, the dealer page and Money all read from the same source; any page still doing its own sum gets corrected.

## Technical notes

- `InvoicePreviewDialog`: build blob first, then `window.open` an object URL for new-tab viewing; keep the in-dialog `<iframe>` but add an explicit fallback state and persistent Download / Open in new tab actions; revoke URLs on close.
- `Billing.tsx` collections rows: replace the icon cluster with a primary Button plus `DropdownMenu`; same for the mobile card footer. Column header rename only, no data change.
- `OrderInvoicePdf`: title and totals-label copy change; render path unchanged. `OrderDetail` hides that button once `hasBill` is true.
- No database, RPC, receipt, or GST logic changes. No new tables or migrations.
- Verification: typecheck, Vitest, build log, then an authenticated browser pass over New Order → order page → dispatch & bill → Money to collect, confirming the bill opens and the money numbers tie out.
