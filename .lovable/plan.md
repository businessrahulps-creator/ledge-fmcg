

# Dashboard: Add "This Month" Summary Row

## Problem

The dashboard currently filters all KPIs and data to a single day (via the day-of-week picker). Business owners want a persistent monthly overview — total revenue, order count, pending payments — visible at a glance without switching views.

## Solution

Add a **"This Month" summary strip** above the day-of-week picker. It shows four key monthly aggregates in a compact horizontal row, always visible regardless of which day is selected. This gives the "big picture" while the day picker continues to handle daily drill-down.

### Design

A single horizontal row of 4 stats, styled as a subtle secondary strip (lighter than the main KPI cards to create visual hierarchy):

```text
┌──────────────────────────────────────────────────────┐
│  This Month                                          │
│  ₹18,42,000 Revenue  ·  312 Orders  ·  ₹2,14,000   │
│                                         Outstanding  │
│  ·  89% Delivered                                    │
└──────────────────────────────────────────────────────┘

  [S] [M] [T] [W] [T] [F] [S]   ← existing day picker

  ┌─────────┐ ┌─────────┐ ...   ← existing daily KPIs
```

- **glass-card** with a single row of 4 inline stats (not 4 separate cards — keeps it compact)
- Stats: **Revenue** (sum of all orders this calendar month), **Orders** (count), **Outstanding** (sum of unpaid/partial totals), **Delivered %** (delivered / total orders)
- Label: "This Month · Apr 2026" in muted text at top
- Mobile: 2×2 grid within the card

### Implementation

**`src/pages/Dashboard.tsx`** — single file change:

1. Compute `monthlyOrders` by filtering `orders` where `o.date` falls within the current calendar month (1st of month to today)
2. Derive 4 stats: `monthRevenue`, `monthOrderCount`, `monthOutstanding`, `monthDeliveredPct`
3. Insert a new `<motion.div>` section between the header and the day-of-week row
4. Style: `glass-card p-4` with `grid grid-cols-2 md:grid-cols-4 gap-3` for the stat items

**No new files. No new dependencies. No database changes.**

