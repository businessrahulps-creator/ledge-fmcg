# Low-risk speed and safety fixes

You asked for no risk right now. So this plan takes only the four items that are
either a real bug or a pure speed win — none of them change what any screen
shows, what a number means, or how money is calculated.

Deliberately **not** doing now: the big one (finding 5, bounded history loading)
and finding 8 (splitting the data context across every page). Both are real
wins, but both touch every screen and need a full re-test. They belong in their
own release once this one is proven.

## 1. Stock save can lie (finding 10) — the only correctness bug here

Today, saving a stock change closes the dialog and shows "Inventory updated"
before the server has answered. If the save then fails, a second, contradictory
message appears — after the user already believes the number changed and may
dispatch against it.

Fix: the save waits for the server. The Save button shows as working and can't
be tapped twice. On success the dialog closes with one confirmation; on failure
the dialog stays open with the real reason, and nothing is claimed.

Same treatment for "Add stock" and "Remove from warehouse", which behave the
same way today.

## 2. One stock change should not re-download everything (finding 7)

Right now, any stock change — including one made by a colleague — re-downloads
the whole stock list, the whole product list and the whole warehouse list, then
rebuilds the entire on-screen stock table. During a bulk dispatch or an import
this repeats over and over.

Fix: when a single stock row changes, fetch just that row and update it in
place, reusing the product and warehouse details already in memory. A burst of
changes is collected into one small query. A genuinely wide change still falls
back to the full refresh, exactly as today.

## 3. Landing page keeps the phone awake off-screen (finding 9)

The animated background on the public landing page keeps its animation loop
running even when scrolled far out of view, draining battery and competing with
scrolling.

Fix: stop the loop entirely when the canvas leaves the screen, restart it when
it comes back. No visual change.

## 4. Database indexes — measure, then add (finding 6)

The heaviest reads filter by company and sort by date, and there is no index
matching both. I will run the real query plans on your live data first, then add
only the indexes the plans actually show a need for — likely orders, invoices,
claims, receipts and credit notes. Indexes are additive and safe; nothing is
dropped or changed.

## On your history-window question

Best practice for this kind of app is a **rolling 90 days live, everything
older fetched on demand**. Ninety days covers day-to-day work (open orders,
current dues, this quarter) with everything instant, and reports that reach
further back pull what they need when asked. Twelve months live is the common
mistake: it makes the first load slow for exactly the big accounts that need
speed most. That decision only matters when we do finding 5 — not in this
release.

## On the security items (1–4)

Those weren't in what you pasted, so I can't act on them. Based on the earlier
permission work, database-level permission checks and the function allowlist are
already in place. Paste findings 1–4 when you have them and I'll check each one
against the code before touching anything.

## Technical notes

- `addStockItem` / `updateStockItem` / `deleteStockItem` in `useStockDomain.ts`
  return `Promise<boolean>`; `Stock.tsx` awaits them, guards a `saving` state and
  emits exactly one toast (page-level), with the domain layer not double-toasting.
- Realtime `stock_items` handler in `DataContext.tsx` uses the existing
  `queueRow` pattern (already used for orders and invoices) with a new
  `refetchStockItemById` in `useStockDomain.ts` that maps against current
  `products` / `locations` state instead of refetching them.
- `ShaderBackdrop.tsx`: `IntersectionObserver` cancels the RAF on exit and
  re-schedules on entry, rather than flipping a boolean inside a still-running
  loop.
- Indexes: `EXPLAIN (ANALYZE, BUFFERS)` on the five reads first; migration adds
  only validated composite indexes.
- Verification: `bunx vitest run` and a typecheck after each item, plus new unit
  coverage for the stock save returning failure.
