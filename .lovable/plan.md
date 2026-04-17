

# Permanent fix: ambiguous time period selectors

## The real problem
Two different time-period systems exist with confusing labels:

**Reports + Billing** (`TimePeriodFilter`):
- Dropdown shows: **Daily / Weekly / Monthly / Yearly**
- Internally means: last 1 / 7 / 30 / 365 days (rolling window from today)
- Users read "Weekly" as *this calendar week* (Mon–Sun) or *last week* — but it's actually *last 7 days from now*
- "Yearly" reads as *this year* but is actually *last 365 days*
- Summary line says "Yearly: ₹X" with no date range — users can't verify

**Performance page**: pills `Today / 7D / 30D / 90D / 6M / YTD / Custom` — clearer but still no visible date range, so users can't sanity-check the numbers.

The fix is the same on both: **make the date range explicit and use unambiguous wording**.

## The fix

### 1. Rewrite `TimePeriodFilter` labels (single source of truth)
**File:** `src/components/reports/TimePeriodFilter.tsx`

Replace the four ambiguous options with explicit "Last N days" wording — same as the Performance page convention — and update `periodLabel()` to match.

| Old value | Old label | New label |
|---|---|---|
| `daily` | Daily | Today |
| `weekly` | Weekly | Last 7 days |
| `monthly` | Monthly | Last 30 days |
| `yearly` | Yearly | Last 365 days |

Keep the type values (`daily`/`weekly`/etc.) so no consumer code breaks. Only the user-facing strings change. The cutoff math is already correct (rolling window) — labels now match the math.

Also export a new helper:
```ts
getPeriodRange(period): { from: Date; to: Date; label: string }
```
which returns the actual date range (e.g., `Mar 18 – Apr 17, 2026`) for display.

### 2. Show the actual date range below every filter
For each report consumer (`PaymentReport`, `DispatchReport`, `DistributorReport`, `ProductReport`, `SalesTeamReport`) and `Billing.tsx`:
- Render a small caption beside/under the filter:
  `Showing 18 Mar 2026 – 17 Apr 2026` (uses `formatIndianDate`)
- This eliminates all ambiguity — users see exactly which dates feed the numbers.

### 3. Apply same treatment to Performance page
**File:** `src/pages/Performance.tsx`
- Below the pill row, add the same date-range caption: `Showing DD MMM YYYY – DD MMM YYYY` (using existing `getCutoffDate`).
- For Custom, show the picked range. For YTD, show `1 Jan 2026 – Today`.
- Keep the existing pill labels (`7D`, `30D`, etc.) — they're industry-standard analytics shorthand and the new caption removes the ambiguity.

### 4. Add a tooltip on each filter trigger
- `TimePeriodFilter` `SelectTrigger` and Performance pills get a tooltip:
  *"Time windows are rolling — 'Last 7 days' means the last 7 days ending today, not the calendar week."*
- One-time clarification, doesn't add visual noise.

## Files changed
1. `src/components/reports/TimePeriodFilter.tsx` — relabel options, add `getPeriodRange()` helper, add tooltip
2. `src/components/reports/PaymentReport.tsx` — show date range caption
3. `src/components/reports/DispatchReport.tsx` — show date range caption
4. `src/components/reports/DistributorReport.tsx` — show date range caption
5. `src/components/reports/ProductReport.tsx` — show date range caption
6. `src/components/reports/SalesTeamReport.tsx` — show date range caption
7. `src/pages/Billing.tsx` — show date range caption next to filter
8. `src/pages/Performance.tsx` — show date range caption below pill row, add tooltip

## Out of scope
- Targets page (`Targets.tsx`) — uses anchored period dates already; not ambiguous.
- DealerDetail / SalespersonDetail period labels (already say "Today / This Week / This Month" with anchored dates).
- No backend / data-shape changes.
- No new dependencies.

## Why this is the permanent fix
- **Removes the ambiguity at the source** (label = exactly what the math does).
- **Always-visible date range** gives users a way to verify numbers themselves — no more "is this last week or this week?".
- **Single helper** (`getPeriodRange`) ensures every consumer stays in sync forever.
- **Matches mental model**: Indian FMCG users think in "last N days" (e.g. "kitne din ka data?") more than calendar buckets — confirmed by the existing dashboard copy on Help page ("Daily — Dashboard for order count").

