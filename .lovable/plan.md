# App-wide audit: what's broken, and the plan to fix it

Three passes: money correctness, screen flows, and live-data integrity on your
account. 11 real issues found. Nothing here changes how a bill is raised or how
stock moves — these are correctness and safety fixes.

## The serious ones

**1. Orders say "Paid" when no money was ever recorded.**
463 orders carry a green Paid chip and 209 say Part paid, but the payments
ledger holds only 6 receipts. The chip comes from an old field on the order; the
money desk, dealer balances and credit checks all read the receipts ledger. So
the same order reads "Paid" on the Orders list and "Still due" on the money desk.
Fix: the Orders list, dealer pages and order page derive the payment chip from
receipts, the one source of truth. The stale field stays in the database
untouched, it just stops driving what people see.

**2. Saving a product, warehouse, dealer or sales person says "Saved" even when it failed.**
Four screens show the success message and close the form without waiting for the
save to come back. If the network drops, the person believes it saved.
Fix: wait for the result, keep the form open and show the real error on failure.

**3. A dealer's outstanding amount is worked out three different ways.**
The figure on the dealer card, the figure the credit check enforces at billing,
and the figure the trigger stores are three separate calculations. Confirmed
live: Adyar Wholesale Beverages shows ₹4,06,936 on screen but ₹4,06,836 is what
the system enforces — the ₹100 advance taken on an order that isn't billed yet
is counted by one and ignored by the other.
Fix: one calculation, used everywhere — bills, minus receipts, minus credit notes,
including advances held on orders not yet billed.

**4. Anyone signed in can edit the sales team, dealers and company bank details.**
Stock and Schemes correctly check the person's permission; Sales team, Dealers,
Targets and Company details don't check at all. A viewer-level account can delete
a sales person or change the GST and bank details on your invoices.
Fix: apply the same permission checks already used elsewhere.

## The medium ones

**5. Lists can show the wrong page after changing a filter.** If the new filter
happens to return the same number of rows, the list stays on page 3 of a
completely different set. Affects Orders, Money desk, Stock, Dealers, Sales team,
Returns, Offers and Targets. Fix: reset to page one whenever a filter or search
changes.

**6. Old pre-GST balance code is still in the codebase.** Unused today, but it
computes what a dealer owes from the order value without tax — the exact mistake
that caused earlier wrong numbers. Fix: delete it.

**7. Return preview and confirmation disagree.** The preview shows the credit
before tax, the confirmation shows it with tax — ₹1,000 becomes ₹1,180. Fix:
show both lines in the preview so the number never changes under them.

## The small ones

**8.** Dealer cards put "Outstanding" (with GST) next to "Lifetime revenue"
(without GST) in identical-looking tiles — label each with its tax basis.
**9.** Clickable rows on Performance, Dealer detail and Stock can't be reached by
keyboard — add proper button semantics.
**10.** The billing button in Settings only shows "coming soon" — make it look
inactive so nobody expects a payment screen.

## Housekeeping found in your data

**11.** 43 products still have unconfirmed GST rates, which blocks billing them;
18 offers are past their end date but still switched on; 15 returns have been
open over 30 days; 315 dispatched orders have no bill raised. These are data, not
code — the screens to clear them already exist, so this is a short cleanup list
rather than a fix.

## How it will be done

One item at a time, highest severity first: make the change, run the type check,
the test suite and the build, then open the app signed into your demo account at
phone and desktop size and prove it on real rows — then report and move on.

## Out of scope

Money formulas themselves, bill raising, stock movement rules, offline mode, and
any change to what a bill or credit note contains.

## Technical notes

- Payment chip: derive from `useReceivables()` / posted `invoice_payments` in
  `Orders.tsx`, `DealerDetail.tsx`, `OrderDetail.tsx`; stop reading
  `order.paymentStatus` for display.
- Await + check result in `Stock.tsx:198-206, 243-251`, `Distributors.tsx:135-142`,
  `Salespersons.tsx:99-106` — mirror `confirmDeleteProduct` (`Stock.tsx:208-214`).
- Collapse the `dealer_balances` view, `dealer_outstanding()` and the inline check
  in `dispatch_and_bill_order_atomic` onto one definition that nets order-anchored
  advances; `DataContext.tsx:223-233` reads that single source.
- `useCan` gating on `Salespersons.tsx`, `Distributors.tsx`, `DealerDetail.tsx`
  (secondary sales), `Targets.tsx`, `Company.tsx`, matching `Stock.tsx:67`.
- `use-pagination.ts:10-13` — reset on a caller-supplied filter key, not on
  `totalItems`.
- Delete `computeDealerAging` / `outstandingOrdersForDealer` / `isOutstandingOrder`
  from `src/lib/aging.ts` (keep the bucket helpers).
- `Claims.tsx:218-220` — show pre-tax and with-tax lines in the preview.
- `role="button"` + `tabIndex` + key handler on `Performance.tsx:731,795,902`,
  `DealerDetail.tsx:506`, `Stock.tsx:716,737`.
