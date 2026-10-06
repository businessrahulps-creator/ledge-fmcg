# Payment labels show the right answer the first time

## The problem
Order pages (Orders list, Dashboard, Dealer page, Order detail) work out "Paid / Partly paid / Unpaid" from money records that load separately from the orders. Before those records arrive, every order briefly shows a guess, then changes when the real figures land. Customers read that as the app being wrong.

The exact flicker sequence the customer saw ("Partly paid" then "Unpaid") is not yet confirmed. Step 1 reproduces it before anything changes.

## What will change
1. **Reproduce first.** Open Orders, Dashboard, a Dealer page and an Order page on a slow connection, record the label at each moment, and confirm which loading step causes each wrong label.
2. **No guessing while loading.** Until the money records are in, the payment label shows a quiet grey placeholder the same size as the badge, not "Unpaid" or "Partly paid". The delivery label is unaffected.
3. **Instant on return visits.** The last known money records are remembered on the device for that business, so labels appear correct straight away on reopen, then quietly refresh. Cleared on sign-out or business switch (same rule as today's other remembered data).
4. **No flip after a save.** After recording a payment, labels keep showing the previous answer until the fresh figures arrive, then update once. They never drop back to a placeholder or a wrong state.
5. **Same rule everywhere.** Payment filters and totals that depend on the label (Unpaid filter, "to collect" sums) wait for real figures too, so counts don't jump.

## Places covered
Orders list (phone and computer), Dashboard recent orders, Dealer page order list, Order detail header, spreadsheet download of orders.

## Technical notes
- `useCollections` store: initial snapshot `loading: true` with empty receipts; `paymentStatusByOrder` then returns "pending" / "partial" from partial data. Add a `ready` flag (first successful load) to `useReceivables` and have `payStatus` return `null` until ready; `StatusBadge` renders a skeleton for `null`.
- Persist the receipts/credit-notes snapshot to sessionStorage keyed by company id, hydrate the store from it (`ready = true`), refresh in background; wipe in the existing sign-out/company-switch cache clear.
- Forced reloads already keep previous receipts. Make sure `loading: true` during a reload doesn't turn badges back to placeholders (gate on `ready`, not `loading`).
- Orders filters/totals and OrderDetail `moneyStatus` read the same gated value.
- Add a unit test: before ready → null; after hydrate → correct status with no intermediate value.
- No database or money-rule changes.
