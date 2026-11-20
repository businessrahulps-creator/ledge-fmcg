# Offers & Schemes — Buy X Get Y Free (different free product) + multi-product offers

Done one phase at a time; each phase pauses for "go" before the next.

## Phase 1 — Offer settings (data)
- Each offer can name a **free product** (for Buy X Get Y). Empty = same product as the one bought (keeps all existing offers working).
- Percentage and Flat offers can list **several products** (or stay "All products"). Existing single-product offers carry over unchanged.
- Nothing existing is removed; old offers keep behaving the same.

## Phase 2 — New / Edit Offer screen
- **Buy X Get Y Free:** "Product to buy" + "Buy quantity", then "Free product" (Same product / Different product picker) + "Free quantity". Min order value and Min product qty are hidden. Plain summary line: "For every 10 Basmati Rice 5kg bought, dealer gets 1 Sunflower Oil 1L free (₹0)."
- **Percentage discount:** discount %, "All products" or "Select products" (multi-pick), optional min order value, optional dealer.
- **Flat discount:** amount ₹, min order value, "All products" or "Select products", optional dealer.
- Offers list shows the free product name and the product list clearly.

## Phase 3 — Order form adds the free item
- When the bought quantity reaches the offer, a **Free** line for product Y is added automatically at ₹0 with a "Free — offer" tag.
- Quantity scales (10 → 1 free, 20 → 2 free); drops below 10 → free line removed.
- Free line price and quantity can't be typed over; ₹0 is allowed only for these free lines (normal lines still need a price).
- Order total charges only product X; the old rupee "saving" for Buy X Get Y is no longer subtracted (so no double benefit).
- Same behaviour when editing an unsent order.

## Phase 4 — Sending, stock and bills
- Free item is packed and its stock leaves the godown on send (stock warning if short, same as any item).
- GST bill, Bill of Supply, thermal receipt, order confirmation and WhatsApp show the free item with quantity and ₹0, marked "Free".
- Returns of a free item give ₹0 credit.
- Reports keep sales value unchanged; free quantity shown separately where quantities are counted.

## Phase 5 — Checks
- Tests: free quantity maths, different/same product, removal below threshold, ₹0 allowed only on free lines, totals not reduced twice, multi-product % and flat matching.
- **Test data in your workspace (clearly tagged "QA-OFFER", removable after):**
  - Three offers: one Percentage (10% on 3 picked products), one Flat (₹500 off above ₹10,000 on 2 picked products), one Buy X Get Y with a different free product (Buy 10 Basmati Rice 5kg, get 1 Sunflower Oil 1L).
  - Three orders: (1) Buy X Get Y order at 20 units → 2 free oil added at ₹0; (2) Percentage order mixing picked and non-picked products; (3) Flat order above and just below ₹10,000.
- Each test order is checked live: order form, saving, sending (stock of the free item goes down), bill/receipt showing "Free" at ₹0, and totals matching the expected figures.
- Results reported with before/after stock and amounts; test data removed only when you say so.

## Not changing
- Existing orders and bills already sent (no rewrite of history).
- Credit notes, payment, credit-day and pricing rules for normal items.

## Technical details
- Migration (additive): `schemes.free_product_id uuid null` (same-company trigger), `schemes.product_ids uuid[] null`; `order_lines.is_free boolean default false`, `order_lines.scheme_id uuid null`.
- `src/lib/order-pricing.ts`: new pure `computeFreeLines()`; buy_x_get_y savings removed from discount when free lines are used.
- `book_order_atomic` / edit path: server recomputes free lines and rejects client-forged ₹0 lines; `tg_order_lines_gross` keeps 0 for free lines.
- `dispatch_and_bill_order_atomic` already deducts per line — verify free lines included and GST taxable = 0.
- PDF/thermal/WhatsApp renderers: "Free" label on `is_free` lines.
