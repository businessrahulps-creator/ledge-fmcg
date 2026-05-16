# PR11 — Break the Pattern (Insight Surfaces, Iconography, Color Depth)

PR9/PR10 made the system **consistent**. The cost of consistency is that everything now looks like the same template — same rounded card, same destructive red, same 12px label. The "Credit at Risk" card is the tell: a critical financial alert is rendered with the exact same visual weight as a neutral KPI strip, with a generic outline triangle icon, a 12px label, and a flat ₹29 number.

PR11 is about **breaking the pattern in the right places** so the eye knows where to land.

## What's still flat (concrete observations)

1. **Credit at Risk card** — outline `AlertTriangle` at 16px in a pale circle, 12px destructive label, 18px bold number. Reads like a notification chip, not a P&L risk. The number (29 dealers, ~₹X lakhs at risk) should be the hero, not the headline word.
2. **Color palette is binary** — we only use Midnight (primary) and Destructive (red). Forest, Terracotta/Amber, and a neutral "ink" tone are defined but unused on Dashboard. Result: alerts compete with primary actions, and there's no middle "attention" tier.
3. **Icons all read the same** — every icon is a 14–16px Lucide outline at 1.5 stroke. No size/weight hierarchy. A risk icon should feel heavier than a nav icon.
4. **"This Month · MAY 2026" label** floats top-right with no anchor. It's the same tracking/weight as "Daily breakdown" but lives in a different role (timeframe vs section title) — currently indistinguishable.
5. **Empty/zero states are loud** — the "Daily breakdown" KPI row shows `₹0 / 0 / 0 / 0` at 24px Playfair. Zeros at editorial scale create false drama. Should dim or collapse.
6. **No insight tier** — Dashboard shows raw KPIs but never tells the user *what changed*. A "vs last month" delta, a tiny arrow, or a "best day this week: WED" line would convert numbers into meaning. This is the single biggest 7→9 lever in dashboard design.
7. **Sparkline is decorative, not labeled** — the peak (WED) has no callout. A small text label "Wed ₹X" anchored at the peak point turns the chart into a story.
8. **StatusBadge has 5 states all using the same dot+pill shape**. Paid (success) and Pending (destructive) deserve identical *shape* but Pending could carry a subtle left-edge accent so the eye lands on what needs action — Paid is the calm default.

## Plan (one PR, surgical edits)

### 1. Promote Credit at Risk to a real risk surface
- Change layout: left rule `border-l-[3px] border-destructive`, no rounded pill icon. Use **filled** `AlertTriangle` (`fill-destructive/15 stroke-destructive`) at 20px.
- Number becomes the hero: `font-heading text-[32px] num text-destructive` on the right, with `dealersAtRisk.length` as primary and a secondary line `₹{atRiskAmount} outstanding`.
- Label changes from "Credit at Risk" (12px) to `text-[11px] uppercase tracking-[0.18em] text-destructive/80` "AT RISK" with the human sentence "29 dealers over their credit limit" in `text-sm text-foreground`.
- Hover: subtle `bg-destructive/[0.03]` wash, not the generic `card-hover` lift.

### 2. Introduce a 3-tier color semantic on Dashboard
- **Calm (Forest/success)** — used for positive deltas, on-track targets, paid status. Currently unused on Dashboard hero — wire into "Delivered 67%" with a tiny `▲ 4%` in `text-success`.
- **Attention (Terracotta/warning)** — used for "approaching limit" tier (e.g., dealers at 80–100% of credit limit, not yet over). Currently we jump straight from neutral to destructive. Add an "amber tier" mini-row above the destructive Credit at Risk card when relevant.
- **Critical (Destructive)** — reserved for actual breach. The promoted card above.

### 3. Iconography hierarchy
- Define three icon weights as utilities:
  - `.icon-nav` — 16px stroke 1.5, `text-muted-foreground` (sidebar, table actions)
  - `.icon-inline` — 14px stroke 1.75, current color (inline with text)
  - `.icon-signal` — 20px stroke 2, filled background tint (alerts, hero metrics)
- Apply across Dashboard, status surfaces, empty states. Replace generic `AlertTriangle` outline on Credit at Risk with the filled `signal` variant.

### 4. Add an insight line to each KPI
- Under each of the 4 "This Month" stats, add a 11px line: `▲ 12% vs Apr` / `▼ 3% vs Apr` / `On track` using `text-success` / `text-destructive` / `text-muted-foreground`.
- For Outstanding: show "Avg 14 days" (DSO proxy) instead of a delta.
- Keep the line optional via prop so empty/new accounts don't show noise.

### 5. Sparkline storytelling
- Label the peak day inline: small `text-[10px]` chip anchored at the peak point with `Wed · ₹X`.
- Label "today" with the same chip style at the rightmost point if non-zero.
- Remove the redundant day-letter row underneath (SAT/SUN/...) when the chip carries the date — or keep but reduce to 8px opacity 0.35.

### 6. Tame zero states
- In "Daily breakdown" KPI row, when value is 0, render in `text-muted-foreground/40` at the same size, OR collapse the four cells into a single line "No activity yet — first order will appear here." This is the difference between "empty dashboard" and "broken dashboard".

### 7. Section-title vs timeframe-chip distinction
- "Daily breakdown" stays as the current uppercase tracked label (section title).
- "This Month · May 2026" becomes a small **pill** with subtle background `bg-muted/40 px-2 py-0.5 rounded-full` so it reads as a *filter/timeframe*, not a section title.

### 8. StatusBadge — quiet vs loud states
- `paid`/`delivered` (good outcomes): keep current pill with dot.
- `pending`/`partial` (needs attention): same pill but add a **2px left bar** in the status color so the eye scans action items down a column instantly.
- `dispatched` (neutral in-flight): no bar, dot only.

## Files touched

- `src/index.css` — `.icon-signal`, `.icon-inline`, `.icon-nav` utilities; insight-line + timeframe-pill helpers
- `src/pages/Dashboard.tsx` — promote Credit at Risk, insight lines, sparkline chip, zero-state taming, timeframe pill
- `src/components/ui/status-badge.tsx` — left-bar variant for `pending`/`partial`
- Audit pass: 2–3 other pages that re-use these patterns (Orders header, Billing tiles) for one-shot consistency

## Out of scope

- Landing/auth, dark mode, mobile redesign
- Any data calculation (insight deltas use placeholder `compareWithPreviousMonth()` already in DataContext where available; otherwise the line is suppressed)

## Verification

Before/after screenshots of Dashboard at 1280×800. Confirm:
- Credit at Risk card now visually outranks the neutral KPI strip
- Three color tiers (Forest / Terracotta / Destructive) all appear at least once
- No regression on contrast ratios; focus rings still visible
