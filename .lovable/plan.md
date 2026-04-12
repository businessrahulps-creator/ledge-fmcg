

# Add 7-Day Revenue Sparkline to Dashboard

## Change

Add a compact sparkline chart below the "This Month" summary card showing daily revenue for the last 7 days. Pure inline SVG — no charting library.

## Implementation

**`src/pages/Dashboard.tsx`** — ~35 lines added:

1. **Compute 7-day revenue data** (after `monthlyOrders` block, before the `isLoading` check):
   ```ts
   const last7Days = Array.from({ length: 7 }, (_, i) => {
     const d = new Date(today);
     d.setDate(today.getDate() - 6 + i);
     const key = d.toISOString().slice(0, 10);
     const dayRevenue = orders
       .filter(o => o.date === key)
       .reduce((s, o) => s + o.total, 0);
     return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), value: dayRevenue };
   });
   ```

2. **Render sparkline** inside the existing "This Month" `motion.div`, after the 4-column KPI grid:
   - Tiny label row: day abbreviations (Mon, Tue, …)
   - SVG `polyline` with `fill="none"` and `stroke="currentColor"` in `text-primary/60`
   - Gradient fill below the line using a `linearGradient` definition
   - Height: 48px, full width of the card
   - Dots on each data point, slightly larger on today

3. **Edge cases**: If all 7 values are 0, show a flat line at the bottom with a "No revenue this week" subtitle.

**1 file modified. No new files. No new dependencies. No database changes.**

