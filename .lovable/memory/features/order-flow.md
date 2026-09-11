---
name: Order flow (book → dispatch & bill → deliver → return)
description: New Order books only (with optional advance); Order Detail is read-first with one next action; vehicle/driver/dispatch date live in the Dispatch & bill dialog
type: feature
---
- **New Order** = booking only: date, dealer, sales person, products, ships-from, notes, plus an optional **Advance received** (amount/mode/reference) posted via `record_order_payment_atomic` right after `book_order_atomic`. Advance failure never loses the booking.
- Vehicle, driver, dispatch date and the shipping warehouse are **dispatch-time** facts — they are asked inside the Dispatch & bill dialog (with the stock-impact preview), never on the booking form or as a standing card.
- **Order Detail** is read-first: money hero → journey → one "next action" card (Dispatch & bill / Mark delivered / Record return) → facts → read-only items → payments → documents → history.
- Editing sits behind a single **Edit order** button and is allowed only before dispatch and before a GST bill exists; after that the order is locked and corrections go through a return / credit note.
- No order-level "payment mode" field is shown; mode belongs to each recorded receipt.
