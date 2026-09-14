# Deep audit: is the money right, and does the flow hold together?

I walked the whole app the way a user does, read the code behind each screen, and checked the live
numbers in the database. Below is the flow as it actually behaves today, then everything I found
that is wrong or will go wrong, then the fix order.

## The flow, as it runs today

```text
NEW ORDER ──────► ORDER PAGE ──────► DISPATCH & BILL ──────► DELIVERED ──────► RETURN
 books the        money box,          stock leaves,           proof of        credit note,
 order, can       one next step       GST bill created        delivery        good stock back
 take advance
                       │                      │                    │               │
                       └──── receipts ────────┴────────────────────┴───────────────┘
                                     │
                              MONEY TO COLLECT
                        (today: only shows GST bills)
```

Two places break this picture:

- Money taken **before** a bill exists (the advance we just added) never appears on Money to collect.
- 213 orders in the database are marked dispatched but have **no bill at all**. This is seed data, so
  it is not a customer problem — but it is the only real material we have to test with, so it is the
  proof that the billing path has a gap.

## What is actually broken

### Blockers — wrong money on screen

1. **Credit limit is checked with the wrong number.** New Order and the edit screen add the order's
   pre-GST value on top of the dealer's GST-inclusive outstanding, so the app lets an order through,
   then the server refuses it at billing time using the correct (higher) figure. Dealers get told
   "fine" at booking and "over limit" at dispatch.
2. **Advances are invisible on Money to collect.** The page is built only from GST bills, so an
   ₹20,000 advance on an unbilled order is counted nowhere on the money desk — not in Collected,
   not in Still to collect. The Payments tab shows it; the headline numbers do not.
3. **Credit notes are never subtracted on Money to collect.** The dealer's balance everywhere else
   nets returns; Money's "Still to collect" does not. No credit notes exist yet, so this bites the
   first time someone records a return.
4. **"Revenue" means three different things.** Dashboard, My Business and Orders use order value
   before GST; Money uses the bill total with GST. Same word, numbers that can never match.
5. **Orders can reach "dispatched" with no bill and no way back.** 213 seed orders sit in exactly that
   state: stock gone, nothing billed, nothing collectable, and the order page offers only
   "Mark delivered". We use those seed orders to prove the fix.

### Serious — data that cannot be trusted later

6. **The stock ledger is empty.** 3,065 stock deductions exist, and the movements table that is
   supposed to record every change has zero rows. Manual stock edits overwrite the quantity with a
   number the browser calculated, so two people editing the same product at once silently lose one
   change, and nothing records who changed what.
7. **Deleting a warehouse leaves its stock behind.** The screen removes it from view; the stock rows
   stay in the database pointing at a warehouse that no longer exists, and come back on refresh.
8. **47 products still have no confirmed GST rate** — every one of them blocks dispatch with an error
   at the worst possible moment instead of being flagged up front.

### Rough edges

9. Bill rows on the order page show an orange "pending" style for real bills, because old bills carry
   the words "sent"/"paid" and only new ones say "final".
10. Deleting an order with payments from the Orders list still fires a raw database error; only the
    order page has the friendly guard.
11. One legacy ₹1,80,000 "proforma" document sits in the archive alongside real bills.

### To verify before fixing (not yet confirmed)

- Whether saving two target fields quickly can create two rows for the same period.
- Whether scheme saves show "Saved" before the server has actually accepted the change.

## Fix order

**Phase 1 — make the money agree with itself**
- Credit checks use the same basis as the server: bill-equivalent value plus GST, minus credit notes.
- Money to collect gains unbilled orders that hold advances, and subtracts credit notes from
  Billed / Still to collect / Over 30 days.
- One name per number: "Order value" (before GST) on Orders/Dashboard/My Business, "Billed" (with GST)
  on Money, labelled on screen so nobody cross-checks the wrong pair.

**Phase 2 — unstick the stranded orders**
- Dispatched-but-unbilled orders get a "Raise the bill" action on the order page and a clear line on
  Money to collect saying goods went out with no bill.
- Bill status badges read from the real document state, old wording included.
- Orders list delete uses the same guard as the order page.

**Phase 3 — make stock trustworthy**
- Every stock change (manual edit, dispatch, return) writes a movement record, and manual edits apply
  a change server-side instead of overwriting a stale number.
- Deleting a warehouse either moves or removes its stock properly, or is refused while stock remains.
- A short "GST rate missing" list so the 47 products are fixed before they block a dispatch.

**Phase 4 — verify**
- Confirm the two open questions above, then a full signed-in run: book with advance → order page →
  dispatch & bill → record payment → delivered → return, checking that the order page, Money, the
  dealer page, Dashboard and My Business all agree at every step.

## Technical notes

- Phases 1 and 2 are presentation and client-calculation changes only; the atomic booking, dispatch,
  payment and return functions stay untouched, and bills stay immutable.
- Credit projection: reuse the server's basis — sum of GST bills minus posted receipts minus credit
  notes, plus the new order grossed up by its GST rate — rather than raw `outstandingAmount + total`.
- Money to collect becomes a union of bill rows and order rows holding receipts, keyed by anchor,
  with credit notes netted per dealer.
- Phase 3 needs one migration: write movement rows from the stock paths and an atomic increment for
  manual adjustments; warehouse deletion gets a guard.
- Release gate: typecheck, Vitest, clean build log, and the signed-in lifecycle run above.
