# Premium Polish Sweep — 5 Phases

You called out 12 issues across 7 surfaces. Below: every issue mapped to a fix, plus the adjacent problems I found while tracing them, grouped so each phase is a clean, surgical PR that can ship and be QA'd independently.

## The team (roles I'll wear)

- **UI Surgeon** — token-only edits, no logic churn (Phases 1, 3, 4)
- **Mobile Lead** — bottom nav, sheets, search, menu parity (Phase 2)
- **Surface Architect** — Targets, Dealers, Sales Team card systems (Phase 4)
- **Code Janitor** — removes dead PWA/activity affordances safely (Phase 1)
- **QA** — Playwright pass + visual diff per phase (every phase)

---

## Phase 1 — Quick Wins & Dead Code (½ day, low risk)

Pure deletions and one-file fixes. Ships first to clear noise.

1. **Command "Last 30 days" header layout** — `Command.tsx` header is `flex-wrap items-end justify-between` with 6 controls + period selector wrapping awkwardly. Fix: split into two rows on `<lg` (actions row + period row right-aligned), tighten gaps, drop the stacked `20 Apr – 20 May` caption onto the same line as the select.
2. **Remove "Check for updates"** — delete `RefreshAppButton` mount from `AppLayout` topbar (PWA disabled per `mem://features/offline-mode-paused`). Keep the component file for now; just unmount.
3. **Hide Activity log entry-point** — gate `ActivityLog` trigger behind a `VITE_FEATURE_ACTIVITY` flag, default off. Routes/page stay; only the topbar/menu affordance hides.
4. **Billing filter row** — `All Types` and `All Time` on the same line on mobile (`grid-cols-2 gap-2` instead of stacked).
5. **Mobile menu nav label parity** — audit `AppSidebar` (desktop) vs mobile menu sheet labels; align verbatim (e.g. "Money to Collect" vs "Billing", "Sales Team" vs "Salespersons"). Single source of truth in a `nav-items.ts` constant.

**Adjacent pattern fixes found**: stray `Refresh` text button on Dashboard hero ("Updated just now · Refresh") — same dead PWA loop, remove.

---

## Phase 2 — Mobile Shell Premium Pass (1 day)

The "kills the premium feel" cluster. All in `src/components/layout/` + mobile menu sheet + `CommandPalette`.

6. **Mobile menu tinted tiles** — current light-orange/peach tile backgrounds (`bg-accent/...` style) feel cheap. Switch to Bone surface + thin Midnight hairline + Forest/Terracotta only on the leading icon chip. Matches `mem://style/landing-tinted-cards` discipline (one tint per section, not per row).
7. **Mobile Search UX** — current full-screen overlay has misaligned input, no recent/empty state, results jump. Rebuild: sticky search header (56px), grouped sections (Recent / Quick actions / Results), `Esc` and swipe-down close, focus-trap, no layout shift behind it. Reuse `CommandPalette` logic, new mobile shell.
8. **Insights tab broken on mobile** — Performance/Insights page overflows, chart legends wrap into KPIs. Add `min-w-0` to flex children, switch KPI strip to `grid-cols-2`, charts get a horizontal scroll container with snap.
9. **Bottom nav polish** — tighten to 56px, active pill uses Midnight not raw bg, add 1px top hairline so it floats over content.

---

## Phase 3 — Forms & Dropdowns Correctness (½ day)

The "nothing comes" + "endless scroll" cluster. Touches all `Select`/`Combobox` usages, not just Stock.

10. **Add Product to Warehouse — empty dropdown** — `availableProducts` is filtering out *all* products when every product is already stocked. Today the placeholder says "All products already stocked here" but the trigger still looks active. Fix: when `availableProducts.length === 0`, disable the trigger entirely, show inline help "Every product already exists here — tap a row to edit quantity", and hide the Initial Quantity field.
11. **Searchable + virtualized product picker** — replace raw `Select` with `Command` combobox (already in shadcn) anywhere product/dealer/salesperson lists can exceed ~20 items: Stock add-product, NewOrder line items, Targets entity picker, Schemes. Add typeahead + `react-virtual` for >100 rows. One shared `<EntityPicker>` primitive.
12. **Audit pass**: grep all `<Select>` with `.map(` over `products|distributors|salespersons|dealers` — migrate to `EntityPicker`. Likely 6–8 call sites.

---

## Phase 4 — Surface Upgrades: Targets, Dealers, Sales Team (1–1.5 days)

The "feels like a form" / "too basic" cluster. Highest visual lift.

13. **Targets page** — currently a bare table+form. Promote to: hero KPI strip (Total target / Attainment / At-risk count), grouped cards per period with progress ring, inline edit drawer instead of full-page form. Use `SignalCard` + `KpiStrip` from `mem://style/pr12-money-pages`.
14. **Dealer cards** — redesign list/grid card: avatar monogram on Midnight, dealer name in Playfair, two-line meta, right-side outstanding pill (Terracotta if >0), tiny sparkline of last 8 weeks revenue, scheme/credit badges. Keep table view as alternate via density toggle.
15. **Sales Team cards** — mirror dealer card shape: monogram, name, this-month attainment ring, top-dealer chip, last activity dot. Symmetry with dealer cards = system feel.
16. **Adjacent**: Schemes list cards get the same primitive treatment (found while reviewing — same "basic form" feel).

---

## Phase 5 — Systemic Polish Sweep (½ day)

Patterns I spotted that aren't in your list but match the same complaints. Done last because they touch many files lightly.

17. **Spacing rhythm** — standardize page headers to one primitive (`PageHeader`) already created in `mem://roadmap/billion-dollar`. Migrate Billing, Targets, Stock, Performance, Schemes (currently each hand-rolled).
18. **Empty states** — every "no data" today is a centered muted line. Replace with `CommandEmptyState` primitive (icon + title + one action).
19. **Toasts hygiene** — sweep for dev-y toasts ("Failed to fetch X"); enforce `handleSupabaseError` per `mem://safety/backend-hygiene`.
20. **Print/PDF leftover** — the dashed A4 guides convo from last turn is still open; bundle the decision (skip guides, just add cross-browser Playwright assert) into this phase as the QA closer.

---

## Sequencing & risk

```text
P1 ──► P2 ──► P3 ──► P4 ──► P5
1d total visible improvement after P1+P2 (highest user-perceived lift)
P3 is risk-isolated (one new primitive, swap call sites)
P4 is the big visual moment — gets its own QA day
P5 only after P1–4 ship clean
```

Each phase ends with: typecheck, `bunx vitest run`, Playwright smoke on `/command`, `/stock`, `/billing`, `/targets`, `/distributors`, manual mobile preview at 390×844.

---

## Open questions before I start

1. **Activity log** — hide entirely (Phase 1 #3) or keep the page reachable via `/activity` direct URL? I'd default to "hide affordance, keep route."
2. **Targets redesign (Phase 4 #13)** — full surface rebuild OK, or do you want me to ship design directions first (3 prototypes via `create_directions`) before I touch code?
3. **Dealer/Sales card (Phase 4 #14–15)** — same question: do you want rendered direction options, or do you trust the spec above and want me to build it?
4. **PWA "Check for updates" (Phase 1 #2)** — fully delete `RefreshAppButton.tsx` or keep the file dormant for when offline mode revives?
