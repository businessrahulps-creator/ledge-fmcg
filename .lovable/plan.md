# Fix the empty-state flash on detail pages

## The glitch

On `/orders/:id` (and the same pattern exists on `/dealers/:id` and `/salespersons/:id`), the page briefly renders the "Order not found" empty state and then snaps back to the real order. That's what you just saw.

## Why it happens

`OrderDetail.tsx` resolves the order with:

```ts
const order = orders.find(o => o.id === id);
...
if (!order) return <EmptyState>Order not found</EmptyState>;
```

`orders` is read from `DataContext` and it can legitimately be `[]` for one or more renders in these cases:

1. **Cold start without IndexedDB cache.** `DataContext` runs a two-phase fetch. Phase 1 (companies, dealers, products…) flips `loading` to `false` as soon as it lands, but `orders` is only populated when Phase 2 finishes a few hundred ms later. During that window, `orders.find(...)` returns `undefined` → empty state flashes.
2. **Transient `NOOP_DATA_STUB`.** If `useData()` runs while the provider is briefly unmounted (sign-out edge cases, error boundary reset), the stub returns `orders: []` for one render.
3. **Realtime / refresh races.** `safeRefetch` itself replaces atomically and is safe, but any code path that resets a domain to `[]` (e.g. the "no companyId" effect that runs if `companyId` momentarily becomes `null` during a profile reload) wipes orders for one render before they're repopulated.

The detail page never checks `loading` — it jumps straight to "not found" the instant the array is empty.

`DealerDetail.tsx` and `SalespersonDetail.tsx` have the exact same shape and the exact same bug.

## The fix

Frontend-only. Gate the "not found" branch on the data actually being ready.

### 1. `src/pages/OrderDetail.tsx`

- Pull `loading` from `useApi()` (already exposed as `api.loading`).
- Replace the current `if (!order)` block with:
  - If `loading` **or** `orders.length === 0` → render `<AppLayout><RouteSkeleton /></AppLayout>` (already used elsewhere). No "not found" copy.
  - Only if `!loading && orders.length > 0 && !order` → render the real "Order not found" empty state with the Back button.

### 2. `src/pages/DealerDetail.tsx`

Same treatment for the `Dealer not found` branch, gated on `loading` / `distributors.length`.

### 3. `src/pages/SalespersonDetail.tsx`

Same treatment for the `Team member not found` branch, gated on `loading` / `salespersons.length`.

### Why not also touch DataContext?

The two-phase fetch is intentional (it unblocks first paint for pages that don't need orders). Forcing `loading` to stay `true` until Phase 2 finishes would regress that optimisation across the whole app. Gating the empty state on the consumer side is the smaller, safer fix and matches how `Orders.tsx` already behaves (it shows skeletons, not "no orders", while data is loading).

## QA after the fix

- Hard refresh `/orders/aa36bc04-43a5-4fb8-90ff-503a7398f668` with IndexedDB cleared → expect skeleton, then the order. No "Order not found" flash.
- Same for `/dealers/:id` and `/salespersons/:id`.
- Visit a genuinely bad id like `/orders/does-not-exist` → after data loads, the real "Order not found" empty state still shows (with the Back to Orders button).
- Navigate between `/orders` → `/orders/:id` repeatedly to confirm no regression on the happy path.

No backend, schema, or domain-logic changes.
