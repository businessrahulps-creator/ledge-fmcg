# App design pass — consistency, hierarchy, and calm

## Design read

Reading this as: a **redesign–overhaul of a working product UI** (order desk, bills, dealers, stock, insights) for **distributor owners and their office/field staff**, with a **quiet, confident, data-first** language, leaning on the existing Ledge V2 / Fluent 2 system rather than a new one.

Honest note on the taste skill: it states up front that it is for landing pages, portfolios and redesigns — *not* dashboards, data tables or multi-step product UI. So we take its transferable parts (audit-first, anti-default discipline, one system per project, honest tokens, restrained motion, real hierarchy) and ignore its marketing-page playbook. The landing page keeps its own `.lp-theme`; nothing here touches it.

Dials for the app: variance 4 (structure over flair), motion 3 (feedback only), density 5 (real work screens).

## What the audit found

- **No shared page header.** A `PageHeader` primitive exists but no page uses it, so every screen invents its own title, subtitle and action row.
- **Radius soup.** Five different corner sizes in daily use (`rounded-md`, `lg`, `xl`, `2xl`, `sm`) with no rule for which belongs to what.
- **221 hardcoded colour classes** still in app screens and components (emerald/amber/slate/gray/white/hex), bypassing the brand palette and breaking colour meaning.
- **No spacing rhythm.** Nineteen different padding/gap values in play; cards range from `p-3` to `p-8` for the same kind of content.
- **Cluttered heavy screens.** Stock (1081 lines), Insights/Performance (1086), Order detail (839), Dashboard (765) each stack too many equal-weight boxes with no clear first thing to look at.
- **Card mismatch.** `glass-card` is used 1–22 times per page with inconsistent internal structure, so similar information looks different from screen to screen.

## The plan

### 1. Lock the foundations (invisible to users, fixes everything downstream)
- One radius rule: controls 6px, cards 10px, sheets/modals 14px, pills full. Everything else retired.
- One spacing rhythm: 4 / 8 / 12 / 16 / 24 / 32 only. Card padding standard 16px, dense tables 12px.
- One type scale: page title, section title, body, label, number. Numbers always tabular so columns line up.
- Colour discipline: colour only means something (money owed, low stock, success, danger). Everything else is ink on paper. Replace all 221 raw colour classes with the brand tokens.

### 2. One header, one card, one table everywhere
- Adopt the existing `PageHeader` on all 20+ screens: title, one-line context, primary action right, filters below. Same position on every screen.
- Standardise the card: optional label, one hero value or content block, optional footer row. Equal heights in any grid.
- Standardise the table: same header band, same row height, same alignment (text left, numbers right), same empty state, same loading skeleton.

### 3. Rework the four busiest screens
- **Dashboard** — one clear "here's your day" band on top, then at most four supporting blocks. Cut duplicate numbers.
- **Orders** — the working queue: strong status column, money to collect visible, filters as chips, bulk actions in one bar.
- **Order detail** — three clear zones: what was ordered, the money, the timeline. Actions stop competing with each other.
- **Stock** — split the wall of controls into Products and Warehouses with a calm toolbar; the add flow gets breathing room.
- **Insights** — reduce card count, one headline signal per section, charts get consistent height and axis treatment.

### 4. Second-tier screens
Bills, Dealers, Dealer detail, Sales team, Salesperson detail, Targets, Schemes, Claims, Reports, Settings, Company, Help — apply the header, card, table and empty-state standards. Layout structure stays; density and hierarchy improve.

### 5. Motion and feedback (restrained)
- Buttons and rows press; sheets and modals ease in; nothing loops, nothing bounces.
- Every action has a visible state: loading, saved, failed. No silent buttons.
- Full support for reduced-motion.

### 6. Verify
- Desktop screenshots of every screen before and after, plus a mobile check so nothing breaks on phones.
- Contrast check on all text and status colours.
- Existing test suite plus new checks: no raw colour classes in app screens, every page uses the shared header.

Desktop leads the decisions; mobile stays functional and uncut.

## Technical notes

- Scope: `src/pages/**` (excluding landing/marketing routes), `src/components/{ui,dashboard,command,orders,reports,layout,settings}`, and the `:root` app token block in `src/index.css`. `.lp-theme` and `src/components/landing/**` are untouched.
- No new UI library. shadcn + Tailwind v3 + existing Fluent 2 tokens only — one system per project.
- Token additions are additive (`--radius-*`, `--space-*`, text scale utilities); existing semantic tokens are not renamed, to avoid the earlier `index.css` breakage.
- New/updated primitives: `PageHeader` (adopt), `AppCard` (canonicalise `glass-card`), table wrapper, `EmptyState`, `SectionHeading`.
- Behaviour is out of scope: no changes to order/billing/payment logic, RPCs, or data flow. Presentation only.
- Rollout in reviewable stages: foundations → primitives → four busy screens → remaining screens → verification.

## Not included

- Landing page changes, dark mode revival, mobile-first restructuring, copy simplification (tracked separately), and any backend or business-logic change.
