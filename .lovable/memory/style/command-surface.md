---
name: Command surface
description: Unified /command page merging old /reports + /performance. URL state contract, signal engine rules, deep-link contract.
type: design
---

# Ledge Command

Single page at **/command** replacing /performance + /reports. Old routes redirect to `/command?tab=...`.

## URL state contract
- `?tab=overview|people|products|drill` (default: overview)
- `?period=today|7d|30d|90d|ytd|custom` (default: 30d)
- `?from=YYYY-MM-DD&to=YYYY-MM-DD` (only when period=custom)
- All navigation uses `useSearchParams` so back/refresh/deep-link work.

## Tabs
- **Overview** — Memory strip · SignalBar · 4 KPI cards (Revenue dispatched, Orders, Collections, Outstanding) · Revenue trend (Forest actual + dashed Midnight target) · Top dealers · Top SKUs · Credit at risk
- **People** — Team summary chips (On track / At risk / Behind) · Salesperson leaderboard with status badges + deep link to `/salespersons/:id#targets` · Dormant dealers
- **Products** — SKU revenue table with delta + stock badge · Scheme impact · Dead stock
- **Drill Down** — Pill-tab switcher over the 5 existing report components (DistributorReport, ProductReport, PaymentReport, DispatchReport, SalesTeamReport). Each report keeps its own exports; bottom shortcut buttons forward-click `[data-export="excel"]` and `[data-export="pdf"]`.

## RBAC
- `salesperson` → redirected to `/dashboard`
- `accountant` → sees Overview + Drill Down only (People/Products hidden)

## Signal engine (`src/lib/command-signals.ts`)
Pure functions. Recompute on period or data change.
- **Credit at risk** (`destructive`) — utilisation ≥ 90%; CTA → `/distributors?filter=overdue`
- **Dormant** (`warning`) — dealer with prior history, no order in period; CTA → `/distributors?filter=dormant`
- **Behind target** (`warning`) — salesperson < 50% of period target; CTA → `/salespersons/:id#targets`
- **Top dealer** (`success`) — leading dealer this period; CTA → `/distributors/:id`
Cap output at 5.

## "Updated X mins ago"
Tracked in Command.tsx by snapshotting `new Date()` each time `api.loading` flips false. Recomputes on tab/period change.

## Command Memory strip
`localStorage` key `ledge.command.lastVisit` — snapshot of last period + revenue + signal count. Renders one-line on Overview only.

## Empty + skeleton states
Every card uses `CommandEmptyState`. While DataContext loads, `CardSkeleton`/`ChartSkeleton`/`KpiRowSkeleton` from `CommandSkeleton.tsx` render in place.

## Deep-link contract (fail-soft)
- `/distributors?filter=overdue|dormant` and `/salespersons?status=behind` are emitted as CTAs.
- Destination pages do **not** yet consume these params — they render unfiltered. **Never break, never blank.** Future PRs can wire actual filtering.

## Files
- `src/pages/Command.tsx` — page shell + URL state + RBAC
- `src/components/command/*` — primitives + tabs
- `src/lib/command-signals.ts` — period helpers + signal engine
- Old `Performance.tsx`/`Reports.tsx` kept on disk for one release; routes are 301-style `Navigate` redirects.
