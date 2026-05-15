# Ledge V2 — In-App Rebrand Plan

**Goal:** Stop looking like a generic SaaS. Look like enterprise software a CFO would trust.
**Strategy:** Your brand identity wins (logo, colors, fonts from the board). Fluent 2 contributes the *system mechanics* — token architecture, elevation/depth scale, motion curves, density, component anatomy, accessibility floors.
**Scope:** `/app/*` only. Landing page (`/`, marketing pages) is a separate plan.
**Risk control:** Hard cutover, but split across 9 small PRs. Each PR is independently shippable and reversible.

---

## The North Star

| Token | Value | Role |
|---|---|---|
| Midnight `#0F1F3A` | Primary | Buttons, links, sidebar, active states |
| Forest `#0E2A22` | Success / positive | Money in, on-time, completed |
| Terracotta `#A0522D` | Accent / warning | Highlights, attention, pending |
| Bone `#F5EFE6` | Background | Page bg, surfaces |
| Neutrals `#0B0B0C → #F2F2F3` | 8-step scale | Text, borders, surfaces |
| Playfair Display | Display | H1/H2 only, page titles, empty states |
| Inter | System | Everything else: body, labels, data, buttons |
| Striped-square mark | Logo | Sidebar, splash, favicon, PWA icons |

**Fluent 2 we adopt** (mechanics, not visuals):
- 4-tier elevation scale (`shadow-2/4/8/16`) replacing current ad-hoc shadows
- Density tokens: control height 32px (compact) / 40px (default)
- Motion: 100/200/300ms with `cubic-bezier(0.33, 0, 0.67, 1)` (Fluent's standard ease)
- Focus ring: 2px outer, 1px inner, 4.5:1 contrast minimum
- Border radius scale: 4 / 6 / 8 / 12 (no more `rounded-2xl` everywhere)

**Fluent 2 we reject:** Segoe UI, Fluent blue, "acrylic" backdrop blur, Microsoft iconography.

---

## Phases (each is one PR)

### PR 1 — Foundation: tokens + fonts (no visible page rewrites)
*~30 min · Touches `index.css`, `tailwind.config.ts`, `index.html`*

- Rewrite `:root` HSL tokens in `src/index.css` to Midnight / Forest / Terracotta / Bone + 8 neutrals
- Add Fluent-style depth tokens: `--shadow-2/4/8/16`, motion easings, density vars
- Add Playfair Display + Inter via Google Fonts in `index.html`
- Update `tailwind.config.ts` font families (`heading: Playfair`, `body/sans: Inter`)
- Delete unused landing tokens from `:root` (move to a `.lp-scope` block so landing keeps working untouched)
- Delete dark-mode block (move to `_archive.css` so it can be revived later)
- Retire brand-purple/coral gradient utilities (keep CSS but unused)

**Visible effect:** Whole app shifts color/font instantly. Layouts unchanged. Some pages will look slightly off — that's fixed in PRs 3-9.

**Guardrail:** Run `bunx vitest run` + visual smoke through 7 main pages before merge.

### PR 2 — Logo, favicon, PWA icons
*~20 min · Touches `src/assets/`, `public/`, `AppSidebar.tsx`*

- Generate new striped-square `Ledge` mark (full lockup + collapsed mark) matching brand board, transparent PNG
- Replace `src/assets/ledge-logo.png` and `ledge-mark.png`
- Replace `public/favicon.png` + PWA `icon-192.png` / `icon-512.png` / `apple-touch-icon.png`
- Update `SplashScreen.tsx` halo to new palette (Bone bg, Midnight mark, soft Terracotta glow)

### PR 3 — Primitives refit
*~45 min · Touches `src/components/ui/*`*

Fluent 2 anatomy applied to: `button`, `input`, `select`, `dropdown-menu`, `dialog`, `badge`, `status-badge`, `tabs`, `card`, `table`. Specifically:
- Button: 3 variants matching board (Primary Midnight, Secondary outline, Tertiary ghost), 32/40px heights, right-arrow icon affordance
- Input/Select: 1px border, 6px radius, focus ring per Fluent 2 spec
- Status pills: Active (Forest wash), Pending (Terracotta wash), Completed (neutral), Neutral (zinc) — exactly the chips on the board
- Card: white surface on Bone bg, `--shadow-2`, no glass effect
- Table: dense 40px rows, hover `bg-neutral-50`, header `text-xs uppercase tracking-wide`

### PR 4 — Layout shell
*~30 min · Touches `AppLayout`, `AppSidebar`, `NotificationCenter`*

- Sidebar: Bone surface, 1px right border, no gradient L mark — replaced with new logo lockup
- Top nav: tighten to 56px (was 72px), Inter 14px labels
- Replace glassmorphic surfaces with flat Bone + 1px borders

### PR 5 — Dashboard
### PR 6 — Orders + New Order + Order Detail
### PR 7 — Stock + Dealers + Salespersons + Schemes
### PR 8 — Reports + Billing + Targets
### PR 9 — Settings + Auth pages (Login/Signup/Reset) + Onboarding + PDFs

Each page-PR does only:
1. Swap remaining hardcoded colors → tokens (also resolves Linear ticket LED-007)
2. Replace serif/heading usage to Playfair only on H1/H2
3. Reduce visual noise to match brand board's quiet density
4. Visual QA at 1280px and 375px before merge

---

## Memory cleanup (PR 1)

Wipe and rewrite:
- `mem://style/design-system` → new palette
- `mem://style/brand-moments` → DELETE (no more rationing — Midnight/Terracotta usable everywhere semantically)
- `mem://style/branding-assets` → new mark
- `mem://style/aesthetic`, `mem://style/dashboard`, `mem://style/landing-palette` → updated descriptions
- Add: `mem://style/fluent2-methodology` (depth/motion/density rules)
- Add: `mem://style/typography-v2` (Playfair H1/H2 only rule)

---

## What we explicitly will NOT touch
- `src/integrations/supabase/*` (auto-generated)
- Landing page (`src/components/landing/*`, `src/pages/Index.tsx`, About/Contact/Pricing/Help/Policies) — separate plan
- Business logic, domain hooks, pricing engine, RLS, edge functions
- PDF *content* (PR 9 only adjusts colors/header treatment, not layout/data)
- Dark mode (archived for V2)

---

## Technical details

**File budget per PR:** PRs 1, 2, 4 < 10 files. PRs 3, 5–9 ~10–25 files each.
**Verification per PR:** `bunx vitest run` (114 tests must stay green) + manual click-through of touched routes at 1280×875 and 375×812.
**Rollback:** Each PR is atomic. Reverting PR N restores PR N-1 cleanly because tokens are additive, not destructive.
**Estimated total time:** ~6 hours across 9 PRs.

---

## Open question for after PR 1

The brand board shows a **diagonal-stripe pattern** (panel 08) as a brand motif. Want me to use it as a subtle background texture on empty states / splash / login left-panel, or skip it for V1? (I'll default to skip unless you say otherwise — easier to add later than remove.)