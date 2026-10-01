# Bring the Arc UI library into Ledge

## What I found
- Arc (uiarc.dev) has about 80 free components you can install, plus paid "Pro" blocks.
- **Button**: free. You can tap or click it, a spinner shows while saving, and the label changes in place ("Save" to "Saved"). It sizes itself for fingers and respects people who turn off animation.
- **Metrics dashboard**: a **Pro block**. Anyone can look at it, but the code only comes with a paid plan. We can't copy its code. We can rebuild the same layout ourselves from free Arc parts (four number tiles that also work as tabs, a 7/30/90-day switch, one chart with "compare to last period", and two ranked lists).
- Ledge already uses the same base (shadcn, the animation library, charts), so Arc parts fit without a rewrite.

## How we adopt it (nothing removed, same pages and buttons)
Arc parts go in behind our existing building blocks, so every screen improves at once and no page has to be rewritten. Colours stay on our white and black look.

### Phase 1: everyday controls
- Button: press feedback, a spinner on Save/Record payment/Send bill, "Saved" shown in place.
- Action button: shows "Saving..." then "Saved" for payments and orders.
- Hold to confirm: for Cancel order and Void bill. This replaces the extra pop-up for these two only; the reason box and the audit record stay.
- Copy button: for bill numbers, GSTIN and phone numbers.
- Toast, skeleton (loading shapes), empty state, badge.

### Phase 2: forms on the phone
- Number field: keeps today's limits and the "set to max" message. Search field, combobox (pick a dealer or product), date range picker, segmented control (the period switch), bottom sheet (phone forms), swipe actions (swipe an order row to mark it sent or record a payment, with the same rules as the buttons).

### Phase 3: numbers and charts
- Metric card, animated counter, sparkline, bar chart, usage meter (credit limit used).
- Rebuild My Business's top section in the metrics-dashboard style. The four tiles are Sales, Money collected, Unpaid amount and Orders. Each tile picks what the chart shows, with a "compare to last period" switch. Below that: top dealers and top products.
- Dashboard gets the same tiles.

### Phase 4: lists
- Filter toolbar and sortable table for Orders, Bills, Dealers and Stock on desktop. On phones they stay as cards.

## Astra's role
- Before each phase, Astra reviews screenshots of the demo business ("Rahul Ps Traders & Co") next to the Arc page and picks what to copy.
- After each phase, Astra reviews again for clarity, plain words and phone use. I fix what it raises.

## Checks after every phase
- Demo business on phone (393px) and desktop: no broken pages, no sideways scrolling, totals still match the database.
- All automatic tests and the type check pass.
- Plain-language words and the white and black look are kept.

## Decision for you
- Pro blocks need a paid Arc plan. The plan above uses only free parts and rebuilds the dashboard look ourselves. If you buy Pro, I can use their blocks directly.

## Technical details
- Install via `bunx shadcn@latest add https://uiarc.dev/r/<name>.json`. Files land in `src/components/arc/...`. Install `arc-foundation` first and map its tokens to our `index.css` variables (no raw colours).
- Arc uses the `motion` package. Framer-motion v11 is present, so add `motion` alongside it or switch imports. Bundle size is checked after Phase 1.
- Wrap existing `src/components/ui/button.tsx`, `status-badge`, `kpi-strip`, `NumberInput` etc. so their public props stay the same; call sites stay unchanged.
- Hold-to-confirm only wraps the trigger; void and cancel still go through the existing atomic RPCs with the reason and the audit row.
- Check Arc's licence for the free items before installing.
- Each phase is its own change, so it can be rolled back on its own.
