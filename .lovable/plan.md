## Phase D — Enterprise polish for "My Business"

Goal: turn `/command` from a power-user dashboard into a surface that fits how owners and managers actually run their week — saved slices, an email that lands every Monday morning, a clean printout for the office wall, and the keyboard shortcuts an operator expects.

A `dashboard-digest` edge function already exists in the repo, so the email piece is mostly wiring + a cron + a settings UI rather than greenfield.

---

### 1. Saved views (was deferred from Phase C)
- New table `command_saved_views (id, user_id, company_id, name, params jsonb, is_pinned, created_at)`. RLS: read = same company, write = own rows.
- New component `SavedViewsMenu` in the page header (right of the period selector): dropdown of views + "Save current as…" + pin toggle.
- `params` captures `{period, from, to, tab}` (URL-derivable today — slicer chips land later if/when we ship C3).
- Pinned views render as 1–3 small chips above the SignalBar so an owner can flip between "All business" and "At-risk only" with one click.

### 2. Scheduled weekly digest
- New table `digest_subscriptions (id, user_id, company_id, frequency, day_of_week, hour_local, timezone, enabled, last_sent_at)`. RLS = own row.
- `digest-cron` edge function (new, hourly): finds subscriptions whose local time matches now, calls existing `dashboard-digest` per subscriber, writes `last_sent_at`.
- pg_cron job hits `digest-cron` hourly.
- New page section in Settings → "Weekly digest" — toggle, day-of-week, time. Plus a "Send me a test now" button.
- Digest email uses Lovable transactional email (`weekly-business-digest` template) with: net position, top 3 signals, top dealer, biggest at-risk dealer, link to `/command`.

### 3. Print layout
- New `print.css` (loaded only on `/command`): hides AppLayout chrome, sidebar, tabs, period selector controls; expands all KPI / leaderboard / chart cards full-width; forces light tokens; page-breaks between Overview sections so a 1–2 page A4 prints cleanly.
- "Print" button in the page header (icon-only on mobile).
- `CommandLineChart` gets a print-specific stroke width + a static caption ("Period: …, Generated: …") so the printout is self-explanatory.

### 4. Density toggle + keyboard shortcuts
- Add `dense` preference (localStorage, no DB): toggles a `data-density="dense"` attribute on the `/command` root; KPI cards shrink padding, leaderboards switch to 8-row, chart height drops from 280 → 220.
- Shortcuts (only when no input is focused):
  - `g o / g p / g s / g r` → Overview / People / Products / Reports tabs.
  - `1 / 2 / 3 / 4 / 5` → period 7d / 30d / 90d / YTD / custom.
  - `s` → focus SavedViews menu, `p` → print, `?` → cheat-sheet sheet.
- Small `KeyboardCheatSheet` component, opened by `?`.

### 5. Targeted a11y pass
- Add proper landmarks: `<nav aria-label="Period">`, `<section aria-labelledby>` on each Overview block.
- Every interactive icon-only button gets an `aria-label` (audit `SignalActions`, `RunRatePill`, `KpiCard` already do — fill the gaps).
- Focus rings on the new `SignalBar` button wrapper (lost when we converted from `<Link>` to nested button).
- Run a quick contrast check on warning/destructive pills against tinted backgrounds; bump opacity where it fails AA.

---

### Technical notes

**Migrations (one):**
- `command_saved_views` + RLS + index on `(company_id, user_id)`.
- `digest_subscriptions` + RLS + unique `(user_id)` + index on `(enabled, hour_local)`.

**New files:**
- `src/components/command/SavedViewsMenu.tsx`
- `src/components/command/KeyboardCheatSheet.tsx`
- `src/components/command/PrintButton.tsx`
- `src/hooks/useCommandShortcuts.ts`
- `src/hooks/useDensityPreference.ts`
- `src/styles/command-print.css` (imported only in `Command.tsx`)
- `src/lib/saved-views.ts` (CRUD + realtime hook, mirrors `command-acks.ts` pattern)
- `src/pages/SettingsDigest.tsx` (or section in existing Settings)
- `supabase/functions/digest-cron/index.ts`
- `supabase/functions/_shared/transactional-email-templates/weekly-business-digest.tsx`

**Modified:**
- `src/pages/Command.tsx` — mount `SavedViewsMenu`, `PrintButton`, density toggle, shortcut hook, print stylesheet, pinned-view chips.
- `src/components/command/SignalBar.tsx` — restore focus ring on the converted button.
- Settings route — add "Weekly digest" card.
- `_shared/transactional-email-templates/registry.ts` — register new template.

**Out of scope (kept for a possible Phase E):**
- Segmentation slicer (territory/rep/channel) — depends on dealer + product metadata we haven't modelled.
- Annotations / comments on signals.
- Share/snapshot URL (signed read-only link).

---

Say **go** to ship all five, or pick a slice: **D1** (saved views), **D2** (digest), **D3** (print), **D4** (density+shortcuts), **D5** (a11y).