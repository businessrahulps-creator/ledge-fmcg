
# My Business — World-Class Audit & Upgrade Plan

Six senior reviewers walked through the current `/command` surface (screenshot + code). Each found wins and gaps. Below is the consolidated read, followed by a phased, shippable plan.

---

## Part 1 — Findings by reviewer

### 1. Apple (Craft, hierarchy, restraint)
**Wins:** Playfair title, generous whitespace, calm Bone palette.
**Gaps:**
- No single hero metric. The eye lands on the title, then 6 equally-weighted alerts, then 4 equally-weighted KPIs. Nothing earns the gaze.
- "by Ledge Intelligence" italic subtitle feels like vendor branding *inside* the customer's own surface. Should be removed or moved to footer.
- Sparklines render as jagged ECG noise — visually loud, informationally empty. They imply trend where there is none.
- Signal cards have left-bar accents but no icon weight tier; everything shouts equally.
- Revenue Trend chart wastes 80% of vertical space because the target line (₹26L) is 70× the peak (₹36K). The chart becomes a flat line at the floor.

### 2. SAP (Operational depth, drill paths, role fit)
**Wins:** Role gating (accountant hides People/Products), URL state, deep-links to filtered pages.
**Gaps:**
- No segmentation: no territory / godown / channel / SKU-category slicer above the fold. Owners think in *segments*, not totals.
- No comparison framework. KPIs show "vs prev period" but signals don't ("15 dealers over 90%" — was it 12 last month? 22?). Trend without baseline ≠ insight.
- No exception workflow. Signals are read-only chips. There is no "mark reviewed", "snooze 7 days", "assign to rep" — so the same alerts will scream tomorrow.
- Forecast missing. SAP-grade dashboards always show *projected close* for the period given current run-rate.
- Aging breakdown (0-30 / 31-60 / 61-90 / 90+) lives in Reports tab but is the single most-asked owner question. It should be on Overview.

### 3. Salesforce (Pipeline, accountability, CRM logic)
**Wins:** People tab exists, Behind Target signal exists, deep-link to `/sales`.
**Gaps:**
- No pipeline view. Where are the *open* orders? What's in dispatch limbo? What's invoiced-not-collected? Owners need the funnel: Quoted → Confirmed → Dispatched → Delivered → Collected.
- Top Dealer card shows one winner but no *movement* (who climbed/fell this period — the real story).
- Activity feed missing. Salesforce taught the industry that "what changed in the last 24h" belongs above the fold (new orders, payments received, claims filed, dealers gone dormant).
- No "next best action" per signal. "58 dormant dealers owe ₹50L" → the right CTA is *"Send WhatsApp blast to 58"*, not *"Chase →"*.

### 4. Stripe (Money clarity, trust, density)
**Wins:** Credit at Risk card with exposure header, currency formatting consistent (₹ + Indian grouping).
**Gaps:**
- The single most alarming number on the page (Outstanding ₹51.67L vs period Revenue ₹42.4K — a 122× ratio) gets no callout. Stripe would frame this as *"Your outstanding is 122× your dispatched revenue this period — that's the headline."*
- Credit at Risk rows all show 100% utilization. Visually identical. Sort by absolute exposure (₹) not utilization %, and show DPO (days outstanding) per dealer.
- No reconciliation strip: opening outstanding → + new invoices → − collections → closing outstanding. This is the money story in one line.
- No collection velocity (₹/day collected, 7-day avg). Stripe dashboards live or die on velocity.
- Currency abbreviations inconsistent: chart says "26.0L", cards say "₹42,400". Pick one (L/Cr for >₹1L, full digits below).

### 5. Google (Speed, signal-to-noise, search, accessibility)
**Wins:** Cmd+K palette exists, sidebar search exists, URL state preserves shareability.
**Gaps:**
- 6 signals is too many for above-the-fold. Google's playbook: surface 3 max, queue rest behind "+ 3 more".
- No global filter persistence (territory/rep selection doesn't survive tab change).
- Empty states are present but the *zero-data* case (new tenant, no orders yet) probably looks broken with all "—" and -99.8% deltas. Needs an "onboarding state" with sample data toggle.
- No keyboard shortcuts on this page (P = People, R = Reports, T = period cycle would be table-stakes).
- Sparklines lack `aria-label` / numeric fallback. Screen readers get nothing.
- The −99.8% delta on every KPI is a **data bug**: today (1 day) is being compared against the 30-day prior window total — the math is correct but the comparison is meaningless. Should compare same-length windows.

### 6. Microsoft (Enterprise polish, density, exportability)
**Wins:** Reports tab unified, footer Excel/PDF exports just landed, role-based access works.
**Gaps:**
- No "Pin to home" / "Save view". Power users build dashboards by saving filter combos. Right now every visit starts from scratch.
- No share/snapshot. "Email this view as PDF to my CA every Monday 9am" is the killer enterprise loop.
- Density toggle missing. Owners on 13" laptops want comfortable; managers on 27" monitors want dense.
- No annotations / comments on KPIs ("Why was revenue down on May 4? — Holiday, per Ramesh").
- Print stylesheet absent — Cmd+P produces a broken page.
- "Updated just now" is good but no auto-refresh cadence and no manual refresh button surfaced near the timestamp (it's in the topbar, far from the data).

---

## Part 2 — Consolidated themes (what to fix)

1. **Hierarchy is flat.** No hero metric. Everything weighs the same.
2. **Comparisons are broken or missing.** −99.8% everywhere; signals have no baseline.
3. **Money story is buried.** Outstanding vs revenue ratio, aging buckets, collection velocity all need above-fold treatment.
4. **No workflow on signals.** Read-only alerts ≠ a tool. Need ack/snooze/assign + bulk-action CTAs.
5. **No segmentation or saved views.** Owners want to slice; managers want to pin.
6. **Charts under-render the data.** Sparkline noise, mis-scaled target line, no annotations.
7. **No "what changed" feed.** Activity log of the last 24-48h above the fold.
8. **Forecasts and pipeline missing.** Projected close, in-flight stages, run-rate.
9. **Enterprise loops missing.** Share-as-PDF, scheduled email, print, density, keyboard shortcuts.
10. **Bugs to squash.** −99.8% delta math; sparkline scaling; "by Ledge Intelligence" subtitle; identical 100% credit bars.

---

## Part 3 — Phased plan (4 phases, shippable per phase)

### Phase A — Truth pass (fixes that restore credibility) — ~1 session
- **Fix delta math.** Compare same-length windows. Today vs yesterday, 7d vs prior 7d, 30d vs prior 30d. Hide delta when prior window has zero data; show "No prior data" badge instead of "−99.8%".
- **Fix sparkline scaling.** Pad domain by 10%, drop sparkline entirely when variance < 5% (show flat dash + value only).
- **Fix Revenue Trend Y-axis.** Auto-scale to max(actual, target × 1.1). When target is unreachable, render a dashed *projected close* line at run-rate instead of a flat target ceiling.
- **Remove "by Ledge Intelligence" subtitle.** Move to a tiny footer mark.
- **Sort Credit at Risk by absolute exposure (₹), not %.** Add DPO column. Differentiate the 100%-utilized bars by exposure size.
- **Add bare reconciliation line** under Outstanding KPI: `Opening ₹X → +Invoices ₹Y → −Collections ₹Z → Closing ₹W`.

### Phase B — Hierarchy & money story — ~1-2 sessions
- **Hero band.** Single big number = *Net Position* (Collected − Outstanding delta for the period) with one-line interpretation: "You're ₹4.2L behind last month at the same point."
- **Collapse Signal Bar to 3 + "more".** Sort by (severity × ₹ impact). Each signal shows its own delta vs prior period.
- **Aging strip on Overview.** 4 stacked bars: 0-30 / 31-60 / 61-90 / 90+ with ₹ and dealer count. Click → filtered dealers.
- **Activity feed (last 24h).** Right rail or below KPIs: orders placed, payments received, claims raised, dealers gone dormant. Plain English, timestamped, deep-linked.
- **Pipeline mini-funnel.** 5-stage bar: Confirmed → Dispatched → Delivered → Invoiced → Collected with ₹ and count per stage.

### Phase C — Workflow & forecasting — ~2 sessions
- **Signal actions.** Each signal gets: primary CTA (Chase / Open / Review), "Ack for 7d" snooze, "Assign to rep" picker. Persist to a new `signal_acks` table.
- **Bulk WhatsApp blast.** "Send WhatsApp to all 58 dormant dealers" → templated message with reminder + last-order-date merge fields.
- **Run-rate forecast.** Projected month-close revenue, collections, target-hit probability. Displayed inline on Overview header.
- **Segmentation slicer.** Persistent filter chips above tabs: Territory · Rep · Channel · SKU Category. Filter state survives tab change, encodes to URL.
- **Saved views.** "Save current filters as…" → "Pin to top of page". User-scoped, stored in profile.

### Phase D — Enterprise polish — ~1-2 sessions
- **Scheduled email digest.** Weekly/daily PDF snapshot to chosen recipients (uses existing PDF infra + a cron edge function).
- **Share view (URL + PDF).** Permalink that encodes period + filters + tab. PDF snapshot of current view.
- **Annotations.** Click any KPI or chart point → leave a note. Notes render as tiny markers on the chart.
- **Density toggle + keyboard shortcuts.** Comfortable / Compact. Shortcuts: O/P/R/D for tabs, [ ] for period, / to focus search.
- **Print stylesheet.** Clean B&W print layout for the whole page.
- **A11y pass.** aria-labels on sparklines + numeric fallback; focus rings audited; tab order verified.

---

## Part 4 — Technical notes (for the build phase)

- **Delta engine** lives in `src/lib/command-signals.ts` — add a `compareWindows(curr, prev, metric)` helper that returns `{ delta, prevAvailable, prevValue }`. KPI cards consume that instead of recomputing.
- **Sparkline gate**: in `CommandKpiCard.tsx`, compute `(max-min)/max`; if `<0.05`, render `<span className="num">{value}</span>` only.
- **Aging strip**: reuse `computeDealerAging` from `src/lib/aging.ts` (already powers PaymentReport footer extra).
- **Activity feed**: derive from existing `orders`, `payments`, `claims` arrays — no schema change. Sort by `updated_at desc`, cap at 8 rows.
- **Signal acks**: new table `signal_acknowledgements(user_id, signal_key, snooze_until, assigned_to)` with RLS by `company_id` via existing `has_capability` pattern.
- **Saved views**: new table `command_saved_views(user_id, name, params jsonb)` with same RLS shape.
- **Scheduled email**: new edge function `command-digest` + Supabase cron; reuses `@react-pdf/renderer` ReportPdf with a new `BusinessSnapshot` page.

No design system changes required — all primitives (`SignalCard`, `KpiStrip`, `InsightLine`, `StatusBadge`, `glass-card`) already exist per `mem://style/pr12-money-pages`. Phase A is purely a math + scaling fix; Phase B-D are additive surfaces.

---

## Recommended sequence
Ship **Phase A this week** (highest credibility-per-hour — kills the visible bugs). Then make a call on B vs C based on whether the pitch lean is "owner clarity" (B first) or "sales workflow" (C first). D is the enterprise upsell wedge.
