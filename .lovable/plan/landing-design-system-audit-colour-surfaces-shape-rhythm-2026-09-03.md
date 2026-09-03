# Landing Design System Audit — Colour, Surfaces, Shape, Rhythm

A joint read using Apple HIG (restraint, one accent, elevation by layering, nested-corner math, optical rhythm) and Material 3 (tonal surface roles, shape scale, state layers). Scope: landing page only (`.lp-theme`). `/app` stays untouched.

## What the audit found

**The good news:** there are no raw Tailwind palette colours (`bg-slate-700`, `text-blue-500`) anywhere in the landing code. Every colour already comes from a token. The mess is not stray hex values — it is that we have *too many overlapping systems* saying the same thing in different words.

### 1. Surfaces: 13 card classes, no single contract
In use today: `lp-card`, `lp-card-premium`, `lp-card-tinted`, `lp-card-glass`, `lp-card-ink`, `lp-card-electric`, `lp-card-mist`, `lp-vcard` + `--ink/--electric/--mist/--neutral`, `lp-bento-hero`, `lp-well`, `lp-glass-frost`. Several are near-duplicates (`lp-card-ink` vs `lp-vcard--ink`) with different radius, padding and shadow. There is no rule for when a card is white vs mist vs ink, so the choice has been made section by section.

### 2. Shape: nine radii competing
`rounded-full` (44), `rounded-md` (11), `rounded-xl` (9), `rounded-3xl` (3), `rounded-2xl` (2), plus hand-typed `[4px] [12px] [22px] [24px] [32px]`. We already own `--lp-r-sm/md/lg/xl` (12/18/24/32) but only the CSS classes use them; components bypass them. Nested elements also break Apple's concentric rule (inner radius = outer − padding), so chips inside cards look pinched.

### 3. Colour semantics quietly broken
`--success` is mapped to Electric blue and `--warning` to Lime, so a "healthy" and an "at-risk" state can render the same. Legacy warm aliases survive the re-palette: `lp-chip-warm`, `lp-mesh-soft-warm`, `lp-vcard--terracotta`, `--brand-purple`, `--brand-coral`. Blue is still doing four jobs at once (brand, primary action, link, positive state), which is why it reads as "too much blue".

### 4. Vertical rhythm: five different section paddings
`py-16/20/24` with `md:py-20/24/28/32` and one `lg:py-36`. Backgrounds are also expressed four different ways for the same intent (`bg-white`, `lp-section-paper`, `lp-mesh-light`, `lp-section-soft`).

### 5. Card heights are accidental
Cards size to their content, so grid rows are ragged; two hard-coded `h-[860px]` / `h-[700px]` blocks fight the rest. No shared media-aspect or min-height contract.

## The fix

### A. One surface scale (Material 3 tonal roles, Apple restraint)
Five roles, nothing else:

| Role | Value | Used for |
|---|---|---|
| `page` | Mist / White alternating | section grounds |
| `surface` | White | default card |
| `surface-sunken` | Mist 96% | wells, inset panels, quiet chips |
| `surface-ink` | Ink | dark feature card / dark block |
| `surface-accent` | Electric | at most **one** card per viewport |

`lp-card` becomes the single card primitive with `variant` = `surface | sunken | ink | accent` and `elevation` = `flat | raised`. All other card classes become aliases for one turn, then are deleted.

### B. Shape scale, applied everywhere
`xs 8 / sm 12 / md 18 / lg 24 / xl 32 / full`. Cards = `lg` (24), large feature/bento = `xl` (32), chips/pills = `full`, icon tiles = `sm`. Every hand-typed radius is replaced. Nested radius follows outer − padding.

### C. Colour discipline
- Restore honest status tokens: success = a green, warning = amber, destructive = red — separate from brand.
- Blue is reserved for: primary buttons, links, the live dot, and one accent per section. Lime stays a small highlight only.
- Delete warm/legacy aliases (`*-warm`, `*-terracotta`, `--brand-purple`, `--brand-coral`) and the classes nothing uses.
- Contrast pass: every text/background pair checked to WCAG AA (4.5:1 body, 3:1 large).

### D. Rhythm and height contract
- Section padding collapses to two steps: **standard** `py-20 md:py-28` and **feature** `py-24 md:py-32`.
- Section background expressed by one class family only (`lp-section-{paper|soft|ink}`).
- Grid cards stretch to equal height per row; visuals get fixed aspect ratios (16:10 / 4:3) instead of arbitrary pixel heights; the two hard-coded tall blocks are re-expressed as aspect ratios.
- Card interior padding standardises to 20 / 24 / 32 by card size.

### E. Guardrails so it stays clean
Extend `src/test/brand-placement.test.ts` to fail the build on: raw Tailwind palette colours in landing code, hand-typed `rounded-[Npx]`, hand-typed section paddings outside the two steps, and use of retired card classes. Plus a short `LANDING-DESIGN-SYSTEM.md` with the tables above.

## Order of work
1. Tokens: surface roles, shape scale, honest status colours, delete legacy aliases.
2. Card primitive consolidation + alias shims.
3. Section rhythm + background family normalisation.
4. Per-section sweep (14 sections) migrating radius, padding, height, colour usage.
5. Remove shims and dead CSS; add lint tests; visual verification at 390 / 768 / 1440; full Vitest + build.

## Technical notes
- All changes scoped under `.lp-theme` in `src/index.css` plus `src/components/landing/**`. No `/app`, no backend, no business logic.
- The shader hero and Final CTA keep their current treatment; only their overlay chips/cards are re-shaped.
- Expected diff: ~1 CSS block rewrite, 14 section files, 2 visual files, 1 test file, 1 new doc.
