
# Phase C — Workflow & Forecasting

Turn the `/command` surface from a read-only dashboard into a working tool: act on signals, forecast where the period lands, slice by territory/rep, and pin saved views.

## What ships

### 1. Signal actions (ack / snooze / assign)
Every `SignalBar` card gets a small action menu next to its CTA:
- **Primary CTA** stays (Chase / Open / Review).
- **Ack for 7 days** — hides the signal until `snooze_until`, re-surfaces automatically.
- **Assign to teammate** — picker of company members; assignee sees it badged on their Dashboard.
- **Mark resolved** — clears it for everyone in the workspace.

Persisted to a new table `signal_acknowledgements (company_id, signal_key, snoozed_until, assigned_to, resolved_at, actor)`. `deriveSignals()` filters by active acks. Realtime so multi-user stays in sync.

### 2. Bulk WhatsApp blast
For two signals — **Dormant** and **Silent & Owing** — add a "Send WhatsApp to all N" button. Opens a sheet:
- Templated message with `{dealer_name}`, `{last_order_date}`, `{outstanding_amount}` merge fields.
- Preview of first 3 rendered messages.
- "Send" opens WhatsApp web/app per dealer (rate-limited via batched `wa.me` links, same pattern as `shareWhatsApp.ts`).
- Logged to `activityLog` so it shows up in Recent activity.

### 3. Run-rate forecast
A new compact strip on the Overview header (under `HeroBand`):
- **Projected close** — current run-rate × days remaining in period.
- **Target hit probability** — `clamp((actual + projected_remainder) / target)` rendered as a 0–100% pill.
- **Collections forecast** — same model for collections.
Pure-function helper `projectClose()` in `command-signals.ts`. Renders inline on `CommandLineChart` as a faint forward-projected dashed segment.

### 4. Segmentation slicer
Persistent filter chips above the Tabs row:
- **Territory** (dealer location)
- **Rep** (salesperson)
- **Channel** (dealer-side metadata; falls back to "All" if not modelled)
- **SKU category** (product metadata; falls back to "All")

State lives in URL (`?territory=…&rep=…`) so it survives tab change, refresh, share. Filters apply to: KPI cards, charts, leaderboards, aging strip, pipeline, activity feed. Signal engine respects the slice.

### 5. Saved views
Top-right of `/command`: a "Views" dropdown.
- Default views: "All business", "My territory", "At-risk only".
- "Save current view as…" — captures `{period, tab, territory, rep, channel, sku_category}`.
- "Pin to top" — promoted views render as chips on Overview.
Persisted to `command_saved_views (user_id, company_id, name, params jsonb, is_pinned)`. RLS by company.

---

## Technical notes

**New tables (migration):**
- `signal_acknowledgements` — RLS via `company_id = get_company_id()`. Realtime ADD TABLE.
- `command_saved_views` — RLS scoped to `user_id = auth.uid()` for writes, `company_id = get_company_id()` for read.

**New files:**
- `src/components/command/SignalActions.tsx` — popover with Ack / Assign / Resolve.
- `src/components/command/WhatsAppBlastSheet.tsx` — templated message composer.
- `src/components/command/RunRatePill.tsx` — projected-close + probability strip.
- `src/components/command/SegmentationBar.tsx` — chip filter row, URL-synced.
- `src/components/command/SavedViewsMenu.tsx` — dropdown + save dialog.
- `src/context/CommandFiltersContext.tsx` — single source of truth for slicer state (reads from URL, exposes typed values + setters).

**Modified files:**
- `src/lib/command-signals.ts` — add `applySegmentation()`, `projectClose()`, plumb ack-aware `deriveSignals()`.
- `src/components/command/SignalBar.tsx` — slot for `<SignalActions />` per card.
- `src/components/command/CommandLineChart.tsx` — render projected segment.
- `src/components/command/tabs/OverviewTab.tsx` — wrap derivations in segmentation, mount `RunRatePill`.
- `src/pages/Command.tsx` — mount `SegmentationBar` + `SavedViewsMenu`.

**Deferred to Phase D (so we don't bloat C):**
- Scheduled email digest
- Share/snapshot URL
- Annotations / comments
- Density toggle + keyboard shortcuts
- Print stylesheet
- Full a11y pass

---

## Suggested split

If C feels too big in one go, ship in this order:
1. **C1** — Signal actions + WhatsApp blast (highest "this is a tool not a chart" payoff).
2. **C2** — Run-rate forecast (cheapest, instantly credible).
3. **C3** — Segmentation slicer + Saved views (largest surface change; URL contract update).

Say **go** to execute end-to-end, or **C1 / C2 / C3** to pick a slice.
