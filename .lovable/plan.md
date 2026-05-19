## Goal

Eliminate horizontal page scroll and clipped numbers on the **Performance** (`/performance`) and **Command** (`/command`) pages at 360–390 px widths. Keep desktop unchanged.

## Audit (what's overflowing)

**Performance — header (src/pages/Performance.tsx ~378–514)**
- Right cluster (period pills + revenue toggle + Export + custom-range From/To) sits in a `flex flex-col` next to the title. The custom-range row uses two fixed `w-[140px]` date buttons with a literal "to" between them → 140 + 140 + gaps overflows narrow phones.
- The "Showing …" date caption is `sm:text-right` only, no `truncate`.

**Performance — Overview/People/Products sections**
- Several rows pair a long entity name with a currency chip using `ml-auto` but no `shrink-0 whitespace-nowrap` on the chip → currency wraps or pushes off-edge (Scheme card line 666, Top Dealers row 720+, similar product rows).
- KpiStrip cells on Performance feed `formatCurrency(totalRevenue)` which on long values can clip — needs `tabular-nums break-keep` and `min-w-0` on the cell wrapper.

**Command — page (src/pages/Command.tsx)**
- Wrapper already has `min-w-0 overflow-x-hidden`, so any overflow is from child primitives leaking. Audit and tighten:
  - `HeroBand`, `CommandKpiCard`, `SignalCard`, `KpiStrip` value text → enforce `tabular-nums whitespace-nowrap` with a mobile size step-down and `min-w-0` on flex parents.
  - `LeaderboardCard`, `CreditAtRiskCard`, `AgingStrip`, `RunRatePill`, `PipelineFunnel` rows → name `min-w-0 truncate`, metric chip `shrink-0 whitespace-nowrap`.
  - `CommandLineChart` and any Recharts wrapper → ensure parent has `w-full min-w-0` and `ResponsiveContainer width="100%"` (most already do; verify).

## Fix

### 1. `src/pages/Performance.tsx`
- Wrap header right cluster in `w-full min-w-0 sm:w-auto` and add `overflow-x-hidden` to the outer header row only on mobile.
- Custom-range row: change both date buttons from `w-[140px]` to `min-w-0 flex-1 sm:w-[140px] sm:flex-none`; wrap the whole row in `flex-wrap`. Make the "to" separator `shrink-0`.
- "Showing …" caption: add `truncate` and `max-w-full`.
- Scheme card header (~666): currency chip → add `shrink-0 whitespace-nowrap tabular-nums`.
- Top Dealers/Products/Alerts rows: name span → `min-w-0 truncate`; revenue/risk chips → `shrink-0 whitespace-nowrap tabular-nums`.

### 2. `src/components/command/*` and Command page primitives
- HeroBand main number: `text-2xl sm:text-4xl md:text-5xl tabular-nums whitespace-nowrap`, parent `min-w-0`.
- KpiStrip / CommandKpiCard / SignalCard value: same `tabular-nums whitespace-nowrap`, label `truncate`, cell wrapper `min-w-0`.
- Leaderboard / Aging / RunRate / CreditAtRisk / PipelineFunnel rows: enforce the `min-w-0 truncate` + `shrink-0 whitespace-nowrap` pattern on every flex row.
- Any horizontal pill strip (signal chips, period selector inside Command) keeps `overflow-x-auto scrollbar-hide` plus `pr-2` to avoid clipping the last chip's shadow.

### 3. Defensive guardrail
- Add `overflow-x-clip` to the `<main>` in `src/components/layout/AppLayout.tsx` (mobile only via `md:overflow-x-visible`) so any future child can't break the page horizontally. Behavior on desktop unchanged.

## Out of scope

- No data, route, or business-logic changes.
- No restructuring of card hierarchies, no new components.
- No font/typography redesign — only mobile sizing tweaks where numbers clip.

## Verification

- Set preview to mobile (375 and 360 widths). On `/performance`:
  - Page never produces horizontal scroll in Overview/People/Products/Alerts tabs.
  - Custom-range date pickers stack cleanly with no off-edge.
  - All currency chips remain on one line beside truncated names.
- On `/command`:
  - KPI hero numbers stay on one line down to 360 px.
  - All ranked rows (leaderboard, aging, credit-at-risk) truncate names instead of pushing chips off-screen.
- Desktop (≥768 px) renders identically to today.
- `tsc --noEmit` clean.
