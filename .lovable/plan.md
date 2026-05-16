# Revenue Recognition: Delivered vs Booked

## Goal
Stop counting an order as revenue the moment it's created. Only `delivery_status = 'delivered'` is **Delivered Revenue** (trusted). `pending` + `dispatched` become **Booked Revenue** (pipeline). `returned` is excluded everywhere.

## 1. Database (one migration)

- Add `orders.delivered_at timestamptz NULL`.
- Trigger `set_delivered_at_on_status`: when `NEW.delivery_status = 'delivered'` and (`OLD.delivery_status` was different OR `delivered_at IS NULL`), set `delivered_at = now()`. When status moves away from `delivered`, clear it.
- Backfill: `UPDATE orders SET delivered_at = updated_at WHERE delivery_status = 'delivered' AND delivered_at IS NULL`.
- Index: `CREATE INDEX orders_company_delivered_at_idx ON orders(company_id, delivered_at) WHERE delivery_status = 'delivered';`
- No changes to RLS — existing company-scoped policies still apply.

We keep query-time filtering in the domain hooks (no view/RPC needed). The dataset is already loaded into `DataContext`; a Postgres view would only duplicate logic and complicate offline cache.

## 2. Shared selector layer (single source of truth)

Create `src/lib/revenue.ts` with pure helpers used by every page/report:

```ts
export const netTotal = (o: Order) => o.total - (o.schemeSavings || 0);
export const isDelivered = (o: Order) => o.deliveryStatus === "delivered";
export const isBooked    = (o: Order) => o.deliveryStatus === "pending" || o.deliveryStatus === "dispatched";
export const isReturned  = (o: Order) => o.deliveryStatus === "returned";

export const deliveredRevenue = (orders: Order[]) => orders.filter(isDelivered).reduce((s,o)=>s+netTotal(o),0);
export const bookedRevenue    = (orders: Order[]) => orders.filter(isBooked).reduce((s,o)=>s+netTotal(o),0);

// date helpers — delivered uses delivered_at, booked uses order.date
export const inDeliveredWindow = (o, from, to) => isDelivered(o) && o.deliveredAt && o.deliveredAt >= from && o.deliveredAt <= to;
export const inBookedWindow    = (o, from, to) => isBooked(o)    && o.date >= from && o.date <= to;
```

Also expose `o.deliveredAt` on the `Order` type and map it in `data-utils.ts` `mapOrders` from `delivered_at`. Update `useOrdersDomain.updateOrder` so when caller transitions to `delivered`, the optimistic local state also stamps `deliveredAt: new Date().toISOString()` (DB trigger is authoritative).

## 3. Dashboard (`/pages/Dashboard.tsx`)

- Replace the single "Revenue this month" KPI cell with a **stacked cell**:
  - Top line (large, Playfair, default fg): **Delivered Revenue** — Forest dot, label "Delivered"
  - Sub line (smaller, muted): **Booked Revenue** — muted amber dot, label "In Pipeline"
- All existing month/prev-month/7-day sparkline derivations recompute using `deliveredRevenue` (with `delivered_at` as the date axis) for the primary figure; sparkline switches to delivered. Pipeline figure is a small companion.
- "Today / Week / Month" filter (if/when present) drives both numbers via the window helpers above.
- Recent Orders table unchanged (it shows order totals, not revenue).

## 4. Performance (`/pages/Performance.tsx`)

- Add a top pill toggle: **Delivered Revenue** (default) | **Booked Revenue**. Store in local state `revenueMode`.
- Every reducer that currently does `s + o.total` (lines 192, 200, 211, 247, 281, 673, 737, 903) goes through:
  ```ts
  const inScope = revenueMode === "delivered" ? isDelivered : (o)=>!isReturned(o);
  const dateOf  = revenueMode === "delivered" ? (o)=>o.deliveredAt : (o)=>o.date;
  ```
- Salesperson leaderboard ranks by the active mode (default delivered).
- Top SKUs: when mode = delivered, sum `quantity` only from delivered orders' lines.
- Area/bar Recharts series keyed off `dateOf(o)` so the time axis matches the mode.

## 5. Reports (`/components/reports/*`)

- Add a shared `<RevenueScopeFilter>` chip at the top of each report tab: **Delivered Only** (default) | **All Orders**.
  - "All Orders" = `pending + dispatched + delivered` (still excludes `returned`).
- Wire into Dealer, Product, Payment, Sales Team reports — each replaces its local `o.total - schemeSavings` reducers with `deliveredRevenue` / `bookedRevenue+deliveredRevenue` based on the scope.
- **PaymentReport**: collection target math (`netTotal`) only sums delivered orders by default.
- DispatchReport keeps its existing status filter (no scope change — that page is about dispatch state itself).

## 6. Targets (`/pages/Targets.tsx`)

- Lines 268, 279, 360: filter `periodOrders` by `isDelivered` before summing. The `entityOrders` window also keys off `deliveredAt` (so a Jan target only counts orders delivered in Jan, not booked in Jan).
- Achievement % therefore reflects delivered-only.
- Show a small subtitle under each target row: "Booked: ₹X" in muted text so reps can still see pipeline context.

## 7. Mobile (360px)

Dashboard hero KPI stacks vertically: Delivered (large) on top, "In Pipeline ₹X" muted below. Performance pill toggle becomes a 2-segment segmented control, full width.

## 8. Out of scope (explicit)

- Partial deliveries.
- Modifying `refresh_entity_aggregates` trigger (distributor `total_value` / salesperson `total_value` stay as gross booked totals — these are denormalized rollups used for list cards; they remain "booked" semantics and we don't surface them as Revenue anywhere primary).
- Edge functions (`dashboard-digest`) — second pass once UI ships.

## Technical Notes (for devs)

- One migration, one trigger, one backfill, one index.
- One new file `src/lib/revenue.ts`. Every revenue site (≈18 reducers across 6 files) routed through it.
- `Order` type gains `deliveredAt?: string`; mapper in `data-utils.ts` updated.
- No new pages, no new primitives — KpiStrip's existing `insight` slot carries the "In Pipeline" sub-line.
- Forest = `text-success` / `bg-success`, muted amber = `text-warning/70` (existing tokens).
