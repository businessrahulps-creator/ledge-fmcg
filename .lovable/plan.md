

# Redesign: Performance Page — Tabbed Layout

## Problem
The page has 11+ widgets stacked vertically in a single scroll: KPIs, credit alerts, dealer performance, sales team, secondary sales, schemes, revenue chart, payment split, dealer bar chart, product velocity, sales ranking, targets, and insights. It's overwhelming — too much to parse at once, especially on mobile.

## Approach: Tab-based sections with persistent KPIs

Keep the 4 KPI cards and time period selector always visible at the top. Group everything else into **4 tabs**:

```text
┌─────────────────────────────────────────────┐
│  Performance          [7D] [30D] [90D] ...  │
│  Real-time business intelligence            │
├─────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐│
│  │Revenue │ │Orders  │ │Avg Ord │ │Collect││
│  │₹4.2L   │ │  12    │ │₹35K    │ │  67%  ││
│  └────────┘ └────────┘ └────────┘ └───────┘│
├─────────────────────────────────────────────┤
│  [Overview] [People] [Products] [Alerts]    │
│                                             │
│  (tab content here)                         │
└─────────────────────────────────────────────┘
```

### Tab 1: Overview (default)
- Revenue Trend chart (with target line)
- Payment Split donut
- Scheme Performance card

### Tab 2: People
- Top Dealers Performance (with churn risk badges)
- Top Dealers by Revenue bar chart
- Top Sales Team (with health badges)
- Sales Team Ranking bar chart

### Tab 3: Products
- Product Velocity bar chart
- Secondary Sales Summary

### Tab 4: Alerts
- Credit at Risk banner
- Targets Overview (top performers / needs attention)
- Actionable Insights (stock alerts, churn warnings)

## Technical Changes

| File | Change |
|------|--------|
| `src/pages/Performance.tsx` | Add `activeTab` state. Wrap existing widget JSX into 4 tab content sections. Add a pill-style tab bar below KPIs (same style as the time period selector). No new components — just reorganizing existing JSX within the same file. |

## What stays the same
- All data, computations, and `useMemo` hooks remain unchanged
- Export PDF functionality untouched
- Pull-to-refresh preserved
- All chart configurations identical
- No new dependencies

## Result
Each tab shows 2-3 focused widgets instead of 11+ in one scroll. Mobile users see meaningful content immediately without scrolling through walls of cards.

