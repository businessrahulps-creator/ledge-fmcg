# Order to cash: one flow from order to GST bill, money, delivery and return

## Verdict on the brief

The audit is largely correct. I confirmed the key defects in the current code before writing this:

- Order lines are inserted by the app *after* the order header is created, so a half-saved order is possible.
- Dispatch, stock movement and invoicing happen as separate saves, not one all-or-nothing step.
- Order Detail sends you to `/billing?order=...` and shows "Generate Invoice" — a second, parallel way to sell.
- Billing asks you to pick one GST percentage and whether it is inside/outside the state, by hand, on every bill.
- Payment is a three-way picker (pending / partial / paid), not real money received. Nothing records rupees.
- Returns reverse the whole order's stock rather than the quantity actually taken back.

So: the direction is right. Two places where I would push back, below.

## Where I disagree with the brief

**1. GST rate — per product, with a company default.**

You said people set GST on the invoice, not per product. That is how it *feels*, because most sellers deal in one rate. But GST is legally tied to the HSN code of each item, and a bill with biscuits (18%) and, say, packaged juice (12%) on it must show both. One invoice-level percentage makes those bills wrong.

The fix that gives you both: a **default GST rate on your company** that auto-fills every new product, plus a rate on each product you can change when it differs. If your whole catalogue is one rate you set it once and never see it again — same feel as today, but the bill is correct when it isn't.

Existing products get flagged "rate not confirmed" and you confirm them in one screen (bulk-apply the default, tweak the odd one). Dispatch is blocked for unconfirmed items so no wrong bill goes out.

**2. Inside-state vs outside-state should not be a question.**

Today you pick it. The system already knows your state and the dealer's delivery state — it will work it out and show the result. You can see it, not choose it.

Everything else in the brief I agree with and will follow.

## Scope decisions locked in

- No real customers yet, so **no legacy reconciliation layer**. Old demo/test orders get cleared and reseeded on the new model. This removes an entire phase of work and risk.
- The old paid / partial / pending picker is **removed everywhere**. Status is always calculated from money actually recorded.
- Five phases, each approved separately. **I test each phase myself** — real database transaction tests, race tests, and browser walkthroughs — before I hand it to you. You test once at the end.

## What you will see when it's done

One work item: the order.

```text
Book order
   ↓
Dispatch & bill        goods leave stock, GST bill created, dealer starts owing
   ↓
Record payment  /  Mark delivered      (either order, any number of times)
   ↓
Record return (optional)   accepted goods return to stock, credit note reduces the balance
```

- **Orders** becomes the working queue: dealer, number, stage, bill total, received, still to collect, and one obvious next button.
- **New Order** loses the payment status, payment mode and "create as dispatched/delivered" controls. Warehouse becomes optional here.
- **Order Detail** is the control centre: stage strip on top, money line beneath (Bill total | Received | Credit notes | Still to collect), and only the buttons that make sense right now.
- **Money to Collect** is renamed **Invoices** and becomes a read-only archive of final bills and credit notes. No bill builder there.
- Wording stays plain: Book order, Dispatch & bill, Mark delivered, Record payment, Record return, View invoice.

## The five phases

**Phase 1 — foundations, nothing switched on**
New tables and columns alongside the old ones: company default GST rate and price basis, product GST rate + "needs confirming" flag, invoice/credit-note number sequences per year, a receipts table, a stock movement ledger, credit-note tables, and a single official "what is owed" view. Plus a read-only health report over existing data. No behaviour changes yet.

**Phase 2 — atomic Book and Dispatch & bill**
Two server transactions that do everything or nothing: `book_order_atomic` and `dispatch_and_bill_order_atomic` (locks stock and the dealer, checks credit, works out tax per line, allocates the bill number, moves stock, writes the bill — one commit). New Order and Order Detail switch over. `/billing?order=` entry point removed.

**Phase 3 — delivery, real receipts, one honest balance**
`mark_order_delivered_atomic` (proof of delivery only — no stock, no money). `record_invoice_payment_atomic` and `void_invoice_payment_atomic`. Every screen that shows an amount owed — Orders, Dealer detail, Dashboard, ageing, Invoices — starts reading the same view. Old status picker deleted.

**Phase 4 — returns and credit notes**
`record_return_and_credit_atomic`: restores only the quantity accepted back as good stock, credits damaged goods without restocking, posts a credit note linked to the original bill and lines, all in one commit. Invoices archive finished; bill and credit-note PDFs use the frozen values stored at posting time.

**Phase 5 — lock the doors and clean up**
Database rules that make posted bills, lines, receipts, credit notes and stock movements impossible to edit or delete from the app. Old direct-write paths removed. Demo workspace reseeded on the new model. Skipped order-lifecycle and billing tests unskipped and passing.

## Technical contract

Database additions (Phase 1):

- `companies.gst_price_basis` (`exclusive|inclusive`, default `exclusive`), `companies.default_gst_rate`.
- `products.gst_rate numeric`, `products.gst_rate_confirmed boolean default false`.
- `order_lines`: booked qty, loaded qty, free qty, physical qty, cancelled short qty, price basis, selected scheme snapshot, gross, discount, taxable, gst_rate, cgst/sgst/igst, line total.
- `invoices`: `source_order_id` with a unique partial index for one final GST invoice per order; frozen seller/buyer/delivery snapshots; `posted_by`, `posted_at`; `fy`.
- `invoice_lines`: full immutable snapshot incl. HSN, unit, rate, tax components.
- `credit_notes` / `credit_note_lines` referencing the original invoice and invoice lines.
- `invoice_payments`: amount `numeric(14,2)`, mode, paid_on, reference, note, `posted|voided`, idempotency key, actor/void reason.
- `stock_movements`: append-only signed deltas with movement type, source document, idempotency key, actor.
- `document_sequences` keyed by company + doc type + financial year, bumped inside the posting transaction.
- View `invoice_balances` and `dealer_balances` implementing exactly the formulas in the brief, with signed invoice balances never clamped before dealer aggregation.

Every posting RPC: `security definer`, pinned `search_path`, resolves the caller's company itself, proves every referenced row belongs to it, validates the state transition, takes all locks in a deterministic order before deciding, recomputes money from stored inputs, honours an idempotency key, and returns ids + document number + totals.

Currency stored as `numeric(14,2)`; document totals must equal the sum of stored line values.

## Testing I will run per phase

- Unit tests on the pricing/tax engine: exclusive and inclusive, mixed rates, paise rounding, BOGO physical units.
- Transaction tests against a real disposable Postgres: forced failure at each step leaves zero trace and burns no document number; same-key retry returns the original result.
- Race tests: two dispatches for the last stock; two orders against one credit limit — one wins, stock never negative.
- Tenant tests: cross-company ids rejected inside every RPC.
- Balance walk-through: ₹1,000 bill → ₹400 receipt → ₹600 Part-paid → ₹100 credit note → ₹500 → void the receipt → ₹900; and paid-then-credited showing ₹100 dealer credit, agreeing to the paise on every screen.
- Browser walkthroughs of the full intra-state and inter-state journeys.

I report exact pass/fail/skip counts each phase and will not call a phase done with a relevant test skipped.

## Out of scope, as you specified

Partial dispatch/backorders, advances and refunds, multi-bill payment allocation, departmental roles or approval chains, e-invoice/IRN, e-way, Tally, offline mode, landing page, Command, Targets, and any visual redesign.

## Not something I can decide

Get your GST practitioner to sign off the rate list, the bill numbering format, and one sample bill + credit note before you invoice a real customer.

## Gap audit — what the brief missed

I checked the plan against the live code. Nine things were not in the brief but will break the MVP if left out. All are now folded into the phases above.

1. **Two versions of "what the dealer owes" already exist.** Each dealer row stores a running total that a database trigger keeps updated from order values. Nine screens read it, including Dashboard, Insights, dealer statements and the WhatsApp chase-up sheet. If we add the new calculated balance without retiring that stored number, two different figures appear side by side. Phase 3 redirects every one of those readers and switches the stored field off.
2. **There is no Cancel order action today.** The brief lists `Cancelled` as a stage but no way to get there. Phase 2 adds it, allowed only before dispatch, with a reason.
3. **Returns currently put stock back the moment the claim is raised**, before anyone accepts it — and rejecting it never takes the stock away again. Phase 4 rebuilds the Claims screen as Record return so only acceptance moves anything.
4. **Credit limit is only checked in the browser.** Nothing stops the same order going through twice. Phase 2 moves the check inside the locked transaction.
5. **Nothing forces a warehouse to exist before the first order.** Since warehouse is required at dispatch, onboarding now creates or prompts for one. Phase 2.
6. **The demo workspace seeder writes the old shapes** — status pickers, invoice-level tax, no receipts. It gets rewritten in Phase 5 or the demo login breaks.
7. **Bill PDFs, WhatsApp share text and Excel exports** all assume one tax rate per bill. They move to per-line rates in Phase 4.
8. **Estimates and proformas** live inside the bill builder we are removing. Decision I am taking unless you object: keep them as a clearly separate "Estimate / Proforma" tool inside Invoices, untouched, so nothing you use today disappears — they just leave the daily order path.
9. **The nightly overdue-alert job** reads the old stored total. Repointed in Phase 3.

### Two honest limitations

- **No throwaway test database.** The brief asks for concurrency tests on a disposable Postgres. I can't create one here. I will run them against an isolated scratch workspace inside the existing database and delete it afterwards — real transactions and real locks, but sharing one server. Good enough to prove correctness; I'll say so plainly in the results.
- **Signing off tax treatment isn't mine to do.** Rate list, numbering format and a sample bill still need your GST practitioner.

### Is it a solid MVP after this?

Yes, for a distributor selling on credit: book, bill correctly under GST, know exactly who owes what to the paise, take money, prove delivery, take goods back with a proper credit note, and never be able to quietly alter a posted bill.

What it deliberately still won't do — and none of these block onboarding:

- Part-shipping an order (all or nothing, short quantity recorded as cancelled).
- Advance payments, refunds, or one cheque covering several bills.
- Purchases, expenses, or a full ledger — this is sales-side only.
- E-invoice/IRN and e-way bills (only required above turnover thresholds).
- Anything offline.

If any of those five are day-one needs for your first customers, tell me now and we resize. Otherwise this is the right MVP line.

---

Approve this and I start Phase 1.
