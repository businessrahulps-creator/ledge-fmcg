# Vyapar vs Ledge: what to borrow, and why switch

## What Vyapar is
Vyapar sells billing and accounting software to shopkeepers and small traders. It runs on desktop and phone, and works offline. Its website talks most about these features (from reading the home, features and pricing pages):
- POS / counter billing, barcode scanning, thermal printing
- Payment reminders on WhatsApp
- Quotations / estimates, delivery challans, purchase orders
- GST e-invoice, e-way bill, GSTR reports, Tally export
- Offline use, backup, desktop app
- Online store, loyalty points, simple manufacturing, expenses, batch / expiry

Vyapar is built for **one owner at one counter**. Ledge is built for **a distributor and a team out in the field**: orders taken by salespeople, credit limits, dispatch from godowns, collecting from dealers, Today's work, Shop visits.

## The answer for prospects: "Why switch?"
Use this on the landing page and in the sales pitch:
1. **Your whole team in one app.** Salespeople book orders and log visits on their phone; the owner sees everything live. Vyapar is mainly one person at a counter.
2. **It tells you who to chase today.** Today's work and dealer promises. Vyapar shows reports; Ledge tells you what to do.
3. **Credit control.** Ledge blocks dispatch over a dealer's credit limit and tracks every rupee owed.
4. **Order → dispatch → bill → payment in one flow,** with stock coming out of the right godown.
5. **Bills can't be changed quietly after they're made.** Corrections go through credit notes, and every action is recorded.
6. **Easy switch:** bring your dealers, products and opening balances (new, see #5 below).

## What to borrow (ranked: biggest value, lowest risk first)
Every item adds something new and changes nothing that already works.

1. **WhatsApp payment reminder with UPI link.** On a dealer or bill, tap "Send reminder": a ready-made message with the unpaid amount and a UPI pay link (built from the company's UPI ID). There's also a "Remind all late payers" list in Money to collect. *This is the feature Vyapar users mention most.*
2. **Quotation (price estimate) to order.** Make a price quote for a dealer, share it as PDF/WhatsApp, and turn it into an order in one tap. Quotes are not GST bills, so they don't affect stock or money.
3. **Delivery challan.** A printable goods note when the load leaves, for goods sent before the bill. It uses the dispatch details you already have.
4. **GST reports for your accountant.** A month's sales and purchases, laid out the way GSTR-1 and GSTR-3B need them, downloadable as Excel/CSV. Ledge already has the bill data. This is reports only; it does not file with the government.
5. **Switch-from-Vyapar import.** Upload Excel exports from Vyapar for parties, items, and opening balances. You check a preview before anything is saved. This removes the biggest reason people stay.
6. **Expenses.** Record rent, fuel, salaries and other spending, so My Business shows money left after costs.
7. **Small-printer bill format.** A narrow 3-inch receipt layout for the bill PDF.

## Not borrowing (and why)
- Counter POS, barcode billing, loyalty points, online store: these are for retail shops, not distributors.
- Offline mode: paused by earlier decision.
- E-invoice / e-way bill filing with the government: kept out of scope earlier, because it needs a registered tax partner.
- Batch / expiry: worth doing for pharma and agri sellers, but it changes how stock works, so it should be planned separately.

## Suggested order to build
Phase 1: #1 reminders, #5 import, and the new "Why switch" landing section.
Phase 2: #2 quotations, #3 challans.
Phase 3: #4 GST reports, #6 expenses, #7 small-printer bills.

## Technical notes
- Reminders: company `upi_id` setting; build a `upi://pay` link and use the existing share-to-WhatsApp helper; log each reminder in activity_log. No new money logic.
- Quotations: new `quotations` + `quotation_lines` tables (company RLS + GRANTs); convert through the existing `book_order_atomic`, never touching invoices.
- Challan: PDF only, built from order and dispatch fields; no new table.
- GST reports: read-only from invoices, credit_notes and purchase_bills, with IST month boundaries.
- Import: parse Excel in the browser, show a preview, then insert through an atomic RPC with an idempotency key.
- Expenses: `expenses` table with void-only edits (same pattern as payments).
- Astra/Claude reviews each phase before release; the existing tests must keep passing.
