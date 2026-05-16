---
name: Landing parity checklist
description: 2-pass refit playbook to bring the landing page onto V2 app design language. Use grep gates to verify.
type: feature
---
Mechanical playbook for the next "make landing match the app" PR. Two passes, both grep-verifiable. Reference docs: `mem://style/design-system`, `mem://style/app-visual-language`.

## Pass 1 — Tokens, type, radius, shadow

Goal: landing reads as V2 brand at a glance, no `lp-*` retired yet.

### Token swaps (in `src/index.css` + landing components)

Replace landing-era tokens with V2 semantic tokens:

| Old (landing era)                            | New (V2)                                    |
| -------------------------------------------- | ------------------------------------------- |
| `--accent-indigo: #4F46E5` / `--ink` indigo  | `hsl(var(--accent))` (Terracotta)           |
| `--ink-light: #4338CA`                       | `hsl(var(--primary))` (Midnight)            |
| Section bg `#FFFFFF`                         | `hsl(var(--background))` (Bone)             |
| Section bg `#FAFAFB`                         | `hsl(34 30% 90%)` (warm tint of Bone)       |
| Section bg `#F4F4F8` / lavender              | `hsl(34 25% 88%)` (deeper warm tint)        |
| Heading `#0A0F1C`                            | `hsl(var(--foreground))`                    |
| Body `#475569` / `#64748B`                   | `hsl(var(--muted-foreground))`              |
| Hairlines `#ECEEF2`                          | `hsl(var(--border))`                        |
| Mute `#94A3B8`                               | `hsl(var(--muted-foreground)/0.7)`          |

### Type

- H1 / H2 → `.h1-display` / `.h2-display` (Playfair, weight 500).
- `font-extrabold` / `font-black` → `font-semibold`. No exceptions.
- Body remains Inter (already the case).

### Radius

- `rounded-2xl`, `rounded-3xl` on cards → `rounded-md` (6px).
- Hero CTA pill keeps `rounded-full` (the capsule is the one signature exception).

### Shadow

- Ad-hoc CSS `box-shadow` on cards → `shadow-depth-4` (resting) / `shadow-depth-8` (hover).
- Hero glass cards keep their bloom for now — addressed in Pass 2.

### Pass 1 regression gates

```bash
rg "#[0-9A-Fa-f]{3,6}" src/components/landing                  # → 0 matches
rg "indigo|sky-[0-9]|violet" src/components/landing            # → 0 matches
rg "font-extrabold|font-black" src/components/landing          # → 0 matches
rg "rounded-(2xl|3xl)" src/components/landing                  # → 0 matches except hero pill
```

## Pass 2 — Primitive reconciliation

Goal: landing reuses app primitives where possible; keeps signature flourishes only where they earn their place.

### `lp-*` mapping

| Landing primitive       | Decision  | Notes                                                          |
| ----------------------- | --------- | -------------------------------------------------------------- |
| `.lp-capsule-cta`       | **Keep**  | Landing-only CTA signature. Re-tint to Midnight + Terracotta.  |
| `.lp-card`              | **Retire**| Replace with app `.glass-card` (Fluent surface).               |
| `.lp-card-glass`        | **Retire**| Replace with `.glass-card`; bloom removed.                     |
| `.lp-card-dark`         | **Retire**| Use Midnight bg + `text-primary-foreground`.                   |
| `.lp-bento-hero`        | **Keep**  | Re-tint sky→indigo wash to Terracotta wash. Max 1/section.     |
| `.lp-bento-numeral`     | **Keep**  | Bracketed `[ 01 ]` typographic thread. No retint.              |
| `.lp-glass-micro`       | **Keep**  | Inner micro-card inside `.lp-bento-hero` only.                 |
| `.lp-progress-glass`    | **Keep**  | Hero proof chip only; re-tint to Terracotta gradient.          |
| `.lp-live-dot`          | **Keep**  | Re-tint to `hsl(var(--success))`.                              |
| `.lp-mesh-*`            | **Keep**  | Ambient texture, restrained, retint warm-cool → warm.          |
| `.lp-grid-soft*`        | **Keep**  | Background grid, retint to `hsl(var(--border))`.               |
| `.lp-noise`             | **Keep**  | Texture overlay, no retint needed.                             |
| `.lp-vignette-top`      | **Keep**  | Retint to `hsl(var(--background))` fade.                       |

### Patterns to import from the app

- Use `Button` from `@/components/ui/button` for secondary CTAs (not bespoke landing buttons).
- Apply `.h1-display` / `.h2-display` to Hero/section headings.
- Pricing: keep "one promoted tier per surface" (already true) — re-tint the promoted tile to Terracotta wash, drop sky/indigo gradient.
- Testimonials, Founder, FinalCTA: replace bespoke proof chips with `Badge` variants where structure matches.

### Pass 2 regression gates

```bash
rg "lp-card[\"' ]|lp-card-glass|lp-card-dark" src/components/landing     # → 0 matches
rg "from-sky|to-indigo|from-indigo|bg-indigo" src/components/landing     # → 0 matches
rg "lp-bento-hero" src/components/landing | wc -l                        # ≤ 5 (one per multi-card section, max)
```

## Section-by-section sweep (Pass 2)

For each file in `src/components/landing/sections/`, the refit prompt should:

1. Open the file.
2. Replace retired `lp-*` classes with `.glass-card` + `.card-hover`.
3. Swap any remaining raw hex for tokens.
4. Confirm headings use `.h1-display` / `.h2-display`.
5. Confirm cards are `rounded-md` (or pill for hero CTA).
6. Run the Pass 2 regression gates.

Order of operations: `Hero` → `Problem` → `Outcome` → `HowItWorks` → `Features` → `WhyLedge` → `LedgeIntelligence` → `Pricing` → `Testimonials` → `Founder` → `FinalCTA` → `Navbar` → `Footer`.

## Non-goals for the parity pass

- No copy changes. No image swaps. No new sections.
- No removal of `lp-*` CSS classes from `src/index.css` until every consumer is migrated (avoid a dead-link half-state).
- No dark-mode work on landing — V2 dark mode is archived for the app, and landing is light-only.

## Why this works in 2 passes

- Pass 1 is a global find-replace on tokens, fonts, radii, shadows. Pure mechanical. Verified by greps.
- Pass 2 is a per-section primitive swap with an explicit allow/retire table. Verified by greps.
- Three docs (this + `design-system` + `app-visual-language`) carry every decision the refit needs.
