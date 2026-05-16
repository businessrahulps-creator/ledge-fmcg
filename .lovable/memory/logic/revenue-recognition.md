---
name: Revenue recognition (delivered vs booked)
description: Delivered = revenue, pending+dispatched = pipeline. Backed by orders.delivered_at trigger and src/lib/revenue.ts helpers.
type: feature
---

**Rule**: Revenue is only recognized when `delivery_status = 'delivered'`. Pipeline = `pending` + `dispatched`. `returned` is excluded everywhere.

**DB**:
- `orders.delivered_at timestamptz` auto-stamped by trigger `trg_set_delivered_at` (set on transition to delivered, cleared when status moves away).
- Index `orders_company_delivered_at_idx`.

**Code**:
- Single source of truth: `src/lib/revenue.ts` — `netTotal`, `isDelivered`, `isBooked`, `deliveredRevenue`, `bookedRevenue`, `orderInScope(o, mode)`, `orderDateForMode(o, mode)`, `RevenueMode = "delivered" | "booked"`.
- `Order.deliveredAt?: string | null` (mock-data.ts) mapped in `data-utils.mapOrders` from `delivered_at`. `useOrdersDomain.updateOrder` stamps it optimistically on transition.
- Date semantics: delivered uses `deliveredAt`, booked uses `order.date`.

**UI wired**:
- Dashboard hero: "Delivered Revenue" primary + "{pipeline} in pipeline" sub-line (Forest dot / amber dot). 7-day sparkline = delivered. Month/prev-month deltas = delivered.
- Performance: `revenueMode` state + segmented pill in header. All reducers, trend chart, top dealers, sales ranking, product velocity respect mode.
- Targets: achievement % calculated against delivered orders windowed by `delivered_at`.
- PaymentReport: "Delivered Only | All Orders" scope select (default delivered).

**Still TODO** (deferred): DistributorReport / ProductReport / SalesTeamReport scope filters; refresh_entity_aggregates trigger remains booked-basis (denormalized rollups).
