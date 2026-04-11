

# Performance Page — Design & Implementation Plan

## Business Value

Indian FMCG distributor owners need answers to these daily questions:
- **"Is my revenue growing or shrinking?"** → Revenue trend line over time
- **"Which dealers are slowing down?"** → Dealer activity ranking with churn risk flags
- **"Which products sell fastest?"** → Product velocity chart
- **"Where is my money stuck?"** → Payment collection rate (paid vs pending vs partial)
- **"Is my stock going to run out?"** → Stock health overview with critical alerts
- **"Which salesperson is performing?"** → Sales team efficiency comparison

The Performance page turns raw data already in DataContext into instant visual answers.

## Architecture

### Navigation
- Add "Performance" to the sidebar `analyzeNav` array with a `TrendingUp` icon
- Add to mobile bottom nav's "More" dropdown (keeps primary nav at 4 items)
- New route `/performance` in `App.tsx`

### Page Structure

```text
┌─────────────────────────────────────────────┐
│ Performance                                 │
│ Real-time business intelligence             │
│                                             │
│ [Time Filter: 7D ▾] [Dealer ▾] [Person ▾]  │
├─────────────────────────────────────────────┤
│ KPI Row: Revenue | Orders | Avg Order |     │
│          Collection Rate                    │
├──────────────────────┬──────────────────────┤
│ Revenue Trend        │ Payment Split        │
│ (Area Chart)         │ (Donut Chart)        │
├──────────────────────┴──────────────────────┤
│ Top Dealers by Revenue (Horizontal Bar)     │
├──────────────────────┬──────────────────────┤
│ Product Velocity     │ Sales Team Ranking   │
│ (Bar Chart)          │ (Bar Chart)          │
├─────────────────────────────────────────────┤
│ ⚠ Actionable Insights (Alert Cards)        │
│  • "Stock critically low: Tea Powder..."    │
│  • "Dealer X: 0 orders in last 30 days"     │
└─────────────────────────────────────────────┘
```

### Data Source
All data comes from existing `useApi()` hook — orders, dealers, salespersons, products, stockItems. No new database queries needed. Filtering by time period is done client-side (same pattern as `TimePeriodFilter`).

### Charts (Recharts)
Uses the existing shadcn `ChartContainer` + `ChartTooltip` wrapper from `src/components/ui/chart.tsx`. Six visualizations:
1. **Revenue Trend** — `AreaChart` grouped by day/week
2. **Payment Split** — `PieChart` (paid/partial/pending)
3. **Top Dealers** — Horizontal `BarChart`
4. **Product Velocity** — `BarChart` by units sold
5. **Sales Team** — `BarChart` by revenue
6. **Insights** — Computed alert cards (stock health, dealer churn risk)

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/Performance.tsx` | **Create** — Main page with filters, KPIs, charts, insights |
| `src/components/layout/AppSidebar.tsx` | **Edit** — Add Performance to `analyzeNav` |
| `src/App.tsx` | **Edit** — Add `/performance` route |

### Design System Compliance
- Uses `AppLayout`, `glass-card`, KPI accent borders, `h-10` buttons
- Indian locale: `formatCurrency()`, `formatIndianDate()`
- Responsive: charts stack vertically on mobile, filters use `grid grid-cols-2`
- Consistent with existing color palette (emerald, blue, amber, indigo accents)
- Loading skeleton while data loads

### Time Filters
`Today | 7D | 30D | 90D | 6M | YTD` as pill toggles (not a dropdown — faster for quick switching)

