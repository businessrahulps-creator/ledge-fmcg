# Brand alignment: roll Ledge palette into the platform

3 phases, warm neutrals preserved. All changes flow through CSS tokens — components untouched except 4 designated "Ledge moments."

## Goal

Bring the platform into visual alignment with the Ledge brand palette **without losing the calm, premium, enterprise feel** that makes the dashboard usable for 6+ hour FMCG operations sessions.

## Guiding principles

- **Tokens, not hardcoded colors.** All changes go through `src/index.css` CSS variables.
- **Calm > vivid in data-dense surfaces.** Tables, badges, sidebar, cards stay quiet.
- **Brand energy is rationed.** Gradient Purple + Coral appear only in 4 designated moments.
- **Warm neutrals untouched.** Backgrounds, cards, borders, sidebar keep current warm-stone palette.
- **Both light + dark mode tuned.** Brand colors slightly desaturated in dark mode to prevent glow.

---

## Phase 1 — Semantic remap (status colors adopt brand language)

**File:** `src/index.css`

| Token | From | To (brand) |
|---|---|---|
| `--success` light | `152 55% 42%` | `172 93% 37%` ≈ Teal `#06B6A4` |
| `--success` dark | `152 50% 48%` | `172 70% 48%` |
| `--warning` | `38 80% 50%` | `38 100% 50%` ≈ Amber `#FFA800` |
| `--destructive` light | `0 72% 51%` | `0 100% 71%` ≈ Coral Pink `#FF6B6B` |
| `--destructive` dark | `0 72% 55%` | `0 90% 68%` |

Every status badge, alert, toast, validation message inherits automatically — zero component changes.

---

## Phase 2 — Primary action color shifts to Electric Blue

**File:** `src/index.css`

| Token | From | To |
|---|---|---|
| `--primary` light | `160 45% 40%` | `222 84% 56%` ≈ Electric Blue `#2563EB` |
| `--primary` dark | `160 40% 55%` | `222 75% 65%` |
| `--ring` light/dark | matches old primary | matches new primary |
| `--sidebar-ring` light/dark | matches old primary | matches new primary |
| `--accent` dark | `160 35% 48%` | `222 60% 55%` |

`--sidebar-primary` stays warm — sidebar is navigation, not action. Tinting it blue would dominate the left rail.

---

## Phase 3 — "Ledge moments" with Gradient Purple + Coral

### 3a. New brand tokens

Add to `src/index.css`:
```css
--brand-purple: 262 83% 58%;        /* #7C3AED */
--brand-coral: 22 100% 62%;          /* #FF8A3D */
--brand-gradient: linear-gradient(90deg, hsl(262 83% 58%) 0%, hsl(22 100% 62%) 100%);
--brand-gradient-soft: linear-gradient(90deg, hsl(262 83% 58% / 0.08) 0%, hsl(22 100% 62% / 0.08) 100%);
```

Add utility classes `.brand-gradient-text` and `.brand-gradient-bg`.

### 3b. The 4 Ledge moments

| # | Surface | File | Treatment |
|---|---|---|---|
| 1 | Splash screen logo wash | `src/components/SplashScreen.tsx` | Gradient halo behind wordmark |
| 2 | Empty state accent | `src/components/ui/empty-state.tsx` | Soft gradient halo behind icon; icon stroke in `--brand-purple` |
| 3 | Order saved celebration | `src/pages/NewOrder.tsx` | Tint celebration with brand gradient instead of generic green |
| 4 | Sidebar wordmark | `src/components/layout/AppSidebar.tsx` | `brand-gradient-text` on "Ledge" only (icon stays mono) |

**Explicitly NOT applied to:** buttons, links, badges, table rows, sidebar background, card backgrounds, hover states.

### 3c. Memory updates

- Update `mem://style/design-system` — new semantic mapping, Electric Blue primary, warm neutrals retained.
- Create `mem://style/brand-moments` — the 4 designated moments + constraint that Purple/Coral never appear elsewhere in-app.
- Update `mem://index.md` Core line.

---

## Out of scope (intentionally)

- Landing page — already on brand palette.
- Card backgrounds, borders, sidebar surface, body text — warm stone preserved.
- Charts, PDFs — keep current palette.
- Component rewrites — only 4 brand-moment files touched.

## Verification

1. TypeScript check + 114 existing tests must pass unchanged.
2. Visual sweep on `/dashboard`, `/orders`, `/stock`, `/billing`, `/settings`, `/login` — light + dark.
3. Status badge audit across Orders / Stock / Billing.
4. Splash + empty state + sidebar wordmark + order celebration land correctly.
5. `rg` sweep for hardcoded `text-teal-*`, `bg-teal-*`, `text-emerald-*` shadowing new tokens; replace with semantic tokens.

## Risk

**Low.** Phase 1+2 are CSS-variable-only, fully reversible by reverting one file. Phase 3 touches 4 isolated components. No database, no logic, no API surface affected. Rollback < 5 minutes.