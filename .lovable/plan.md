## Ledge Command — Execution Plan (Approved)

Single PR. Merges `/performance` + `/reports` into unified `/command` surface with 4 tabs.

## Build list

### Foundation
- New route `/command` → `src/pages/Command.tsx` with 4 tabs (Overview / People / Products / Drill Down)
- **URL state contract:** `?tab=overview&period=month&custom=...` — synced via `useSearchParams`, survives back button + refresh + deep linking
- Sidebar: replace "Reports" + "Performance" entries with single "Command" entry
- `/reports` + `/performance` kept as **redirects to `/command?tab=...`** for one release
- RBAC: `salesperson` → `/dashboard`; `accountant` sees Overview + Drill Down only

### Primitives (`src/components/command/`)
- `SignalBar.tsx` + `signal-engine.ts` — derives 3-5 signals from DataContext
  - **Recomputes on period change** (deps include selected period)
  - **"Updated X mins ago"** timestamp from `dataContext.lastFetchedAt`
  - Every CTA is **deep-linked + pre-filtered** (e.g. `/dealers?filter=overdue`, `/sales/:id#targets`, `/dealers/:id`)
- `DeltaPill.tsx`, `CommandKpiCard.tsx`, `CommandLineChart.tsx`, `LeaderboardCard.tsx`, `CreditAtRiskCard.tsx`, `PeriodSelector.tsx`
- `CommandEmptyState.tsx` — every card/chart uses when data is zero for the selected period (short plain-English copy per surface)
- `CommandSkeleton.tsx` — wired off existing `dataContext.loading` flags, renders for all cards/charts during fetch

### Overview tab
- Period selector (URL-synced) + SignalBar
- **Command Memory strip**: one-line "Last time you were here: …" read/written via `localStorage` key `ledge.command.lastVisit`
- 4 KPIs (Revenue dispatched · Orders · Collections · Outstanding) with delta pills
- Revenue Trend (Forest actual + dashed Midnight target)
- 2 leaderboards (Top 5 Dealers · Top 5 SKUs)
- Credit at Risk card (70/90 thresholds)

### People tab
- **Team summary strip** at top: `X On Track · Y At Risk · Z Behind` chips, each filters the leaderboard
- Salesperson leaderboard with status badges, expand row → sparkline + top 3 dealers + CTAs to `/sales/:id#targets`
- Dormant Dealer card with per-row "View dealer →"

### Products tab
- SKU Revenue table with delta + stock-health badge
- Scheme Impact card
- Dead Stock card

### Drill Down tab
- Pill-tab switcher over the 5 existing report components (imported as-is, zero modifications)
- **Two always-visible buttons** at the bottom of every report: **Download Excel · Download PDF** (never inside a dropdown), operating on filtered dataset

### Polish
- New memory: `mem://style/command-surface` (design contract + URL state shape + signal-engine rules)

## Deep-link contract (additive, fail-soft)

- New URL filter params on `/dealers` (`?filter=overdue|dormant`) and `/sales` (`?status=behind`, hash `#targets`)
- **If the destination page does not yet consume the param, it renders the unfiltered view — no blank states, no errors.** Adoption is incremental; nothing breaks today.

## Flagged for follow-up (NOT in this pass)

- Server-side signal precomputation (only needed >5k dealers)
- Materialized weekly-bucket view for sparklines
- Real "Send reminder" dispatch wiring (placeholders for now)
- Polished custom date-range calendar popover (phase 1 = 2 native date inputs)
- Scheme lift analysis (attributable vs incremental)
- Full filter consumption on `/dealers` + `/sales` for every new param

## Risk surface

- Old `/reports` + `/performance` → redirects (no broken links)
- Existing report components consumed, not modified
- DataContext untouched — read-only consumer
- New URL params additive — old links keep working
- New code isolated under `src/components/command/`, `src/pages/Command.tsx`, `src/lib/command-signals.ts`

## File touch list

**New:** `src/pages/Command.tsx`, `src/components/command/*` (~10 files), `src/lib/command-signals.ts`, `mem://style/command-surface`
**Modified:** `src/App.tsx` (route + 2 redirects), `src/components/layout/AppSidebar.tsx` (nav swap), `.lovable/memory/index.md` (1 line)
**Kept as redirects (1 release):** `src/pages/Performance.tsx`, `src/pages/Reports.tsx`