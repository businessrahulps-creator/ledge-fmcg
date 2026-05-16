## Goal

Take the V2 design from "good 7/10" to "crafted 9/10" without changing functionality, layout, or business logic. Five tight polish themes, all token‑level and component‑level. No new pages, no copy rewrites, no behavior changes.

## Theme 1 — Typographic rhythm (the single biggest lift)

Playfair currently renders with default leading and tracking, which makes H1s feel "set" rather than "designed." Editorial polish here radiates everywhere.

- H1 (Playfair): tighten `letter-spacing` to ~‑0.02em, `line-height` 1.05, true `font-weight: 500` (not semibold). Editorial weight, not bold weight.
- H2 (Playfair): ‑0.01em tracking, line‑height 1.15.
- Add a reusable `.h1-display` + `.h2-display` utility so every page H1 is identical (right now each page sets its own classes — drift is visible).
- Subtitles under H1: standardize at `text-[13px] text-muted-foreground` with one‑line max, no `md:` doubling.
- Inter body: enable `font-feature-settings: "ss01", "cv11"` + `text-rendering: optimizeLegibility`. Free quality win.
- Numeric tabular alignment: add `.num` utility (`font-variant-numeric: tabular-nums`) and apply to every KPI value, table amount column, and the live clock.

## Theme 2 — Surface, depth, and edges

The Bone background + white cards is correct, but edges currently feel slightly hard and shadows slightly muddy.

- Refine `--shadow-2` / `--shadow-4` to use a warm shadow color (Midnight at very low alpha, `hsl(218 60% 14% / 0.04)`) instead of cool slate — matches Bone palette.
- Add `--shadow-focus: 0 0 0 3px hsl(var(--ring) / 0.18)` and replace ad‑hoc focus rings on Button/Input/Select with this token.
- Card hairline border: lighten from `border-border/70` to `border-border/60` and add an inner highlight `inset 0 1px 0 hsl(0 0% 100% / 0.6)` on `.glass-card` for the "lifted paper" look.
- Section dividers: replace solid `border-t` with `bg-gradient-to-r from-transparent via-border to-transparent` hairlines on Settings + Dashboard section breaks.

## Theme 3 — Component micro‑polish

Small craft fixes on shared primitives, propagates app‑wide.

- **Button**: tighten letter‑spacing on labels (‑0.005em), default to `font-medium` not `font-semibold`, add `active:translate-y-[0.5px]` to default variant, normalize icon‑gap to `gap-1.5` (currently mix of 1.5 / 2). Add `subtle` variant (transparent bg, muted hover) for secondary actions like "Refresh" / "Export CSV".
- **StatusBadge**: tighten — `text-[11px]`, `tracking-wide`, dot size 5px not 6px, vertical alignment fix (currently dot sits ~1px low), uppercase on the label for ledger feel.
- **Input / Select**: 40px → keep, but add `focus-visible:border-ring` (currently border stays gray on focus, only ring changes — feels disconnected). Placeholder `text-muted-foreground/70` not `/100`.
- **Table**: header row `text-[11px] uppercase tracking-wider text-muted-foreground`, row height tightened from 56px to 52px, hover background `bg-muted/30` (less heavy), add right‑aligned `.num` on amount cells.
- **Tabs**: replace pill underline with a 2px Midnight bar that animates with `transition-transform`, matching the editorial tone.

## Theme 4 — Top bar + sidebar refinement

These are visible on every screen. Currently functional but a bit raw.

- **Top bar (`AppLayout`)**: current 56px header has the sidebar toggle far left and clock + user + bell crammed right. Add 16px gap rhythm, vertical hairline separators between clock / user / actions, and make the IST clock use `.num` + smaller `IST` label baseline‑aligned. "Super Admin" → make it a quiet chip with role color.
- **Sidebar**: 
  - Wordmark padding: align the "Ledge" mark optical center with nav item icons (currently sits ~2px left of icon column).
  - Active item: replace background fill with left 2px Midnight bar + bold label — more editorial, less "selected pill."
  - Section labels ("HOME", "MANAGE"): already small caps; tighten tracking to 0.18em and reduce vertical padding by 4px.
  - Footer "Ledge v26.05.16.0455" → smaller, `text-[10px]`, opacity‑60.

## Theme 5 — Dashboard hero + KPIs (the page everyone sees first)

- "Good Afternoon, Asha" block: add a thin 1px Midnight underline that animates in on mount under the greeting (editorial signature). Subtitle "Updated just now · Refresh" → restyle as `text-[12px]` with `Refresh` as a quiet text link not a button.
- **This Month strip**: currently four labels feel like a header row. Promote to a proper card with subtle background tint (`bg-card`, depth‑2), KPI values in Playfair at 22px so they echo the H1, deltas (▲ 12%) added as muted micro‑labels.
- **Mini chart**: thicken stroke to 1.5px Midnight, add `linearGradient` fill `Midnight → transparent` at 8% opacity for area, soften gridless baseline. Replace day labels with `text-[10px] uppercase tracking-wider`.
- **Day chip rail (Sat 9 … Today 15)**: today chip uses Midnight bg (good); tighten chip height to 44px, add a tiny dot under today's chip as a "you are here" mark.
- **4 KPI cards** (Revenue / Orders / Pending / Dispatched): currently feel utilitarian. Refit:
  - Label: `text-[10px] uppercase tracking-widest text-muted-foreground` (already close)
  - Value: Playfair `text-3xl`, tabular‑nums
  - Add a tiny trend sparkline (12px tall) or a single delta line under each value
  - Hover: `.card-hover` → already exists, just confirm it's applied.

## Technical sections

### Files touched

- `src/index.css` — new H1/H2/num/shadow tokens; refined depth shadows; section divider utility.
- `src/components/ui/button.tsx` — letter‑spacing, gap‑1.5, `subtle` variant.
- `src/components/ui/input.tsx`, `select.tsx` — focus border, placeholder opacity.
- `src/components/ui/status-badge.tsx` — size + alignment.
- `src/components/ui/table.tsx` — header type, row height, .num on amount.
- `src/components/ui/tabs.tsx` — underline indicator.
- `src/components/layout/AppLayout.tsx` — top bar rhythm + separators.
- `src/components/layout/AppSidebar.tsx` — wordmark alignment, left‑bar active state, footer version.
- `src/components/layout/LiveClock.tsx` — tabular numerals.
- `src/pages/Dashboard.tsx` — greeting underline, KPI typography upgrade, chart restyle.
- Apply `.h1-display` across all page H1s via a small sed pass (PR6/PR7 already use the same class string).

### Out of scope (do not touch)

- Landing page (`src/components/landing/**`) — separate plan owns this.
- Auth pages (Login/Signup) already polished in PR8.
- Any business logic, data layer, routes, or copy.
- Dark mode (archived for V2).

### Rollout

Single PR ("PR9 — Polish pass"), self‑contained. Verify by screenshotting Dashboard, Orders, Settings, Dealer detail at 1280×800 + 390×844 before/after.

## Acceptance

Side‑by‑side: H1s feel published (not typed), KPI numbers feel like a ledger (not a spreadsheet), shadows look warm (not slate), focus rings are visible and intentional, sidebar active state reads as editorial. Target: 9/10.