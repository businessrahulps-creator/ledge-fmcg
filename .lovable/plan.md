# Make cancelled orders clear and locked

## What we found
Main screens (from your screenshots):
1. Order page: a cancelled order still shows "Edit order".
2. Order page: "Order confirmation" download and WhatsApp share still work.
3. Order page: top band says "Not sent yet / Not paid yet" and "STILL DUE" in red.
4. Nothing tells staff what happened to stock. (Stock is only taken out when an order is sent, and a sent order can't be cancelled, so a cancelled order never touched stock.)
5. Orders list: the "Cancelled" tag is tiny and pale, and the payment tag ("Not paid") still shows next to it.

Connected places found in the extra check:
6. Orders list "Pending" filter still includes cancelled orders (they're saved as "pending").
7. Orders CSV export writes "Pending" for cancelled orders instead of "Cancelled".
8. Dashboard "orders to send" counts and the recent orders table count and show cancelled orders as pending.

Already correct (no change): dealer balances, unpaid amounts, Today's work, reports, sales totals, salesperson and dealer statements all already skip cancelled orders.

## What changes
- Order page for a cancelled order:
  - Clear red "Cancelled" badge in the top band in place of sent/paid tags.
  - Read-only: no Edit, no Delete button, note "Locked — this order was cancelled."
  - No order confirmation download or WhatsApp share.
  - Money summary: amount to collect ₹0, "Order cancelled — no payment due". Any payment already taken keeps showing as before (refund choices untouched).
  - Stock note in the cancelled panel: "Stock untouched — nothing was taken out of [godown]."
- Orders list (computer and phone): bold red Cancelled badge, payment tag hidden, row slightly dimmed but readable.
- Orders list "Pending" filter leaves out cancelled orders; add a "Cancelled" filter option.
- Orders CSV: status column says "Cancelled".
- Dashboard: cancelled orders left out of the to-send / sent counts; recent orders show "Cancelled".

## Not changing
Cancelling rules, database, stock, payments, bills, credit notes.

## Technical details
- One helper `src/lib/order-cancelled.ts` (`isOrderCancelled`, `displayDeliveryStatus` returning "cancelled") with tests.
- `OrderDetail.tsx`: `canEdit &&= !cancelledAt`; hide `DocumentsPanel` confirmation/WhatsApp and delete when cancelled; HeroBand badge; balance-to-collect 0 when cancelled and no payments.
- `Orders.tsx`: `deliveryFilter` adds "cancelled", "pending" excludes cancelled; badge token `bg-destructive text-destructive-foreground`; CSV lines 291/581 use helper.
- `Dashboard.tsx` lines 214/215/350/764/790 use helper.
- Verify with tests + Playwright on the cancelled order on desktop and phone.
