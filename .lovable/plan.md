

# Fix "Your business, at a glance" Feature Icon

## Issue
The "Your business, at a glance" feature card in `src/components/landing/sections/Features.tsx` uses `LayoutGrid`, which is a generic grid icon. The feature describes a dashboard with daily revenue, total orders, and dispatch statuses — a analytics/dashboard icon would be more appropriate.

## Change

| File | Change |
|------|--------|
| `src/components/landing/sections/Features.tsx` | Replace `LayoutGrid` import and usage with `BarChart3` — a chart icon that clearly represents a dashboard/analytics view |

