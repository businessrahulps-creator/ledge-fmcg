# PR12–15 — Platform-wide Pattern Break

PR11 promoted Credit at Risk from flat KPI to a real risk surface with insight lines, icon tiers, and a 3-color semantic system. The same flatness exists across every inner page: rows of identical neutral KPI cards, undifferentiated alerts, generic outline icons, no MoM/peer deltas, no zero-state taming. This audit applies the same treatment platform-wide.

## Operating principles (carried from PR11)

1. **One hero per page.** Find the single most action-worthy number/state and promote it (32px Playfair, left rule, signal icon, insight line). Demote everything else to a hairline strip.
2. **Three semantic tiers, always.** Success/Forest for on-track, Warning/Terracotta for "approaching", Destructive for breach. No page should be monochrome neutral.
3. **Icon weight = signal strength.** `.icon-nav` for chrome, `.icon-inline` for body, `.icon-signal` (20px filled tint) for alerts and hero metrics only.
4. **Every KPI gets an insight line** (`▲ 12% vs last month`, "Avg 14d", "On track") or it gets demoted to a label, never a bare number.
5. **Tame zeros and empty states.** Dim to `text-muted-foreground/35`, or collapse to a single sentence.
6. **Status surfaces beat status pills.** When a state needs action (overdue, low stock, lapsed dealer), add the left-bar treatment, not just a colored dot.

## Per-page opportunities

### PR12 — Money pages (highest leverage)
The pages where wrong-looking numbers cost real money.

- **`Billing.tsx`** (1055 lines): Outstanding total, Overdue >60d, Collected this month → hero card with Overdue as the promoted destructive surface (left rule, dealer count, ₹ amount, "X invoices past due"). Insight line under each tile (`▲ ₹X vs Apr`, "Avg DSO 18d"). Invoice rows: pending/overdue get left-bar StatusBadge (already shipped) plus row-level `border-l-2 border-destructive/40` when >60d overdue.
- **`OrderDetail.tsx`** (868 lines): Promote "Balance due" when non-zero with the destructive surface treatment; demote "Subtotal/Tax/Discount" to hairline-divided strip. Payment status header → signal icon + 32px num. Add insight chip "Paid in 4 days" / "Overdue 12 days".
- **`Claims.tsx`** (509): Pending claim value gets promoted to warning surface (Terracotta, since "approaching" not "breach"). Approved/rejected demoted.

### PR13 — Inventory & operations
- **`Stock.tsx`** (1004): Low-stock count → promoted destructive surface ("X SKUs below reorder point — ₹Y revenue at risk if dealer orders today"). Out-of-stock items get a row-level left-bar. "Healthy" stock gets a calm success dot, not a colored pill. Warehouse cards: utilization % gets the 3-tier color (≤70 success, 70–90 warning, >90 destructive).
- **`Orders.tsx`** (400): Hero strip: "Pending dispatch" (warning), "Overdue delivery" (destructive), "Delivered this week" (success delta). Today's orders count → 32px num with `▲ vs yesterday`.
- **`NewOrder.tsx`** (779): Credit-check inline result becomes a signal surface — when dealer is over limit, show the same red-left-bar block from Dashboard's Credit at Risk inline above the cart total (not a toast).

### PR14 — People & performance
- **`Dealers (Distributors).tsx`** (377): Lapsed dealers count → promoted warning surface ("12 dealers no order in 30+ days"). Top-revenue dealer chip → success surface with "▲ ₹X vs last month".
- **`DealerDetail.tsx`** (585): Outstanding balance vs credit limit → promoted bar surface using 3-tier color based on utilization. "Last order 45 days ago" → warning insight chip in header, not buried in metadata.
- **`Salespersons.tsx` + `SalespersonDetail.tsx`**: Target achievement % → 3-tier color hero (red <60, amber 60–90, success ≥90) with `▲ vs last month`. Promote "below target" reps as a warning row.
- **`Performance.tsx`** (1054): This page is mostly KPI cards — heaviest refit. Convert top row to one hero (top mover / biggest drop) + hairline-divided supporting strip. Add MoM deltas everywhere. Add peak callouts to existing charts.
- **`Targets.tsx`** (492): Behind-target reps/products → promoted warning/destructive surface with named list, not a generic count.

### PR15 — Detail/settings polish + global components
- **`Schemes.tsx`** (601): Expiring schemes (next 7 days) → promoted warning surface. Active schemes count demoted.
- **`Reports.tsx`, `Settings.tsx`, `Company.tsx`**: No KPIs but plenty of generic outline icons — apply `.icon-nav` vs `.icon-inline` distinction; promote unfinished setup steps in Settings (warning surface) similar to SetupChecklist.
- **Global components**:
  - `EntityHistory.tsx` / `ActivityLog.tsx`: critical events (payment failed, credit breach) get left-bar; routine events stay quiet.
  - `NotificationCenter.tsx`: 3-tier semantic on notification type icons (currently all neutral).
  - `EmptyState.tsx`: a calmer variant (`text-muted-foreground/40` headline, no big icon) for "no activity yet" cases to use across tables.
- **New shared primitives** in `src/components/ui/`:
  - `<SignalCard>` — the promoted surface used by Credit at Risk; props: `tier: 'success'|'warning'|'destructive'`, `icon`, `label`, `value`, `caption`, `insightLine`.
  - `<KpiStrip>` — hairline-divided horizontal strip with insight-line slot per cell.
  - `<InsightLine>` — `▲/▼/—` with delta + comparator + auto-color.

Building these three first (start of PR12) lets every subsequent page swap in 5–10 lines instead of bespoke markup.

## Sequencing & sizing

| PR | Pages | Effort | Why first |
|----|-------|--------|-----------|
| 12 | Shared primitives + Billing, OrderDetail, Claims | M | Money pages = highest user impact; primitives unblock the rest |
| 13 | Stock, Orders, NewOrder | M | Operational daily-use surfaces |
| 14 | Dealers, Salespersons, Performance, Targets, detail pages | L | Most KPI-heavy; biggest visual transformation |
| 15 | Schemes, Reports, Settings, global components | S | Polish + consistency sweep |

Each PR ends with a Playwright/manual screenshot pass and a memory note (`mem://style/pr12-…`).

## What this is NOT

- Not a redesign — same layout, same routes, same data.
- No new business logic. MoM deltas use existing data already in `DataContext`; where unavailable, the insight line is suppressed.
- Landing/auth/dark mode untouched (already archived).
- No mobile-specific redesign — desktop-first; mobile inherits via existing responsive utilities.

## Out of scope / explicit non-goals

- Charts library swap (Recharts stays).
- New empty-state illustrations.
- Reordering nav/IA.
- Any change to PDF templates.

## Risks

- **Color overuse.** If every page promotes something, nothing stands out. Rule: max **one** promoted surface per page above the fold, max **two** total per page.
- **Insight-line noise.** Suppress when sample size <2 months or value is 0. Better no line than `▲ 0%`.
- **Primitive churn.** Build `SignalCard` / `KpiStrip` / `InsightLine` once at start of PR12, freeze API, then propagate.

## Deliverable per PR

- Working pages
- Before/after screenshots at 1280×800
- Memory file `mem://style/prNN-…`
- Updated `mem://index.md`

Ready to start with PR12 (shared primitives + money pages) when you approve.
