

# Final Adversarial QA — Audit & Production Readiness Plan

## Audit Summary

The platform is in excellent shape after two prior passes. This fresh adversarial review found **3 remaining calculation inconsistencies** — all in the same file. No critical or security issues.

## Critical
**None.**

## High Priority

### H1. Dashboard sparkline revenue uses raw total (not scheme-adjusted)
**File:** `src/pages/Dashboard.tsx` line 103
The sparkline computes `dayRevenue` using `o.total` without subtracting `schemeSavings`. The "This Month" card above it correctly uses `o.total - (o.schemeSavings || 0)`. This means the sparkline visual overstates revenue.
**Fix:** Change line 103 to `.reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0)`

### H2. Dashboard day-of-week KPI revenue uses raw total
**File:** `src/pages/Dashboard.tsx` line 129
The daily KPI "Revenue" card uses `filteredOrders.reduce((s, o) => s + o.total, 0)` — again missing the scheme savings subtraction.
**Fix:** Change to `filteredOrders.reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0)`

## Medium / Low
No additional issues found. Previous audits already addressed:
- Dark mode status classes ✓
- Backup pagination ✓
- FK constraints ✓
- Scheme-adjusted Orders export ✓
- Sonner toast standardization ✓
- DialogDescription on Schemes ✓
- Mobile save button spacing ✓
- Filtered child table queries ✓
- bank_account_name in company select ✓

## Implementation Plan

| Step | Issue | Line | Fix |
|------|-------|------|-----|
| 1 | H1: Sparkline revenue | 103 | Subtract `(o.schemeSavings \|\| 0)` |
| 2 | H2: Day KPI revenue | 129 | Subtract `(o.schemeSavings \|\| 0)` |

Both fixes are in `src/pages/Dashboard.tsx`. Two surgical one-line changes. No new files, no new dependencies, no database changes.

