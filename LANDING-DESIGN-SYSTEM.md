# Ledge Landing Design System (v4)

Scope: the marketing landing page only — everything is scoped under `.lp-theme`.
The in-app UI (`/app`) keeps its Fluent 2 system (6px radius, compact density) and
is unaffected by anything in this document.

Principles borrowed deliberately:
- **Apple HIG** — one accent colour, elevation expressed by layering rather than
  outlines, concentric corner radii, optical vertical rhythm.
- **Material 3** — tonal surface roles instead of ad-hoc card colours, a named
  shape scale, and status colour that is semantically independent of brand colour.

## 1. Colour

Brand anchors (raw HSL, defined once in `.lp-theme`):

| Token | Value | Role |
|---|---|---|
| `--brand-electric` | `#1B57F5` | primary action, links, live dot, one accent per section |
| `--brand-ink` | `#1B2130` | text, dark surfaces |
| `--brand-lime` | `#C8F250` | small highlight only, never a surface |
| `--brand-mist` | `#E5E4F0` | quiet page ground |

Status colour is **independent of brand** so "healthy" and "at risk" can never
render the same:

| Token | Meaning |
|---|---|
| `--success` `152 52% 34%` | healthy, paid, in stock |
| `--warning` `34 92% 46%` | attention, ageing |
| `--destructive` `0 72% 51%` | overdue, blocked |

Helpers: `.lp-status-ok`, `.lp-status-warn`, `.lp-status-bad`.

Rules:
- Never write a raw Tailwind palette class (`bg-slate-700`, `text-blue-500`) in
  landing code. Enforced by `src/test/landing-design-system.test.ts`.
- Blue is punctuation, not background. At most one blue-filled element per
  viewport.

## 2. Surfaces

Five roles, nothing else:

| Role | Token | Used for |
|---|---|---|
| page | `.lp-section-paper` / `.lp-section-soft` / `.lp-section-ink` | section grounds |
| surface | `--lp-surface` (white) | default card |
| sunken | `--lp-surface-sunken` | wells, inset panels, quiet chips |
| ink | `--lp-surface-ink` | dark feature card / dark block |
| accent | `--lp-surface-accent` | at most one card per viewport |

Card contract: `.lp-card` is the primitive. Modifiers: `--sunken`, `--ink`,
`--accent`, `--flat`, `--xl`. Interior padding: `.lp-pad-sm` 20, `.lp-pad-md` 24,
`.lp-pad-lg` 32.

Retired (do not reintroduce): `lp-card-dark`, `lp-card-midnight`,
`lp-card-forest`, `lp-card-terracotta`, `lp-card-bone`, `lp-chip-warm`,
`lp-mesh-soft-warm`, `--brand-purple`, `--brand-coral`.

## 3. Shape

| Step | Value | Used for |
|---|---|---|
| `rounded-lp-xs` | 8px | dense chrome, tiny tiles |
| `rounded-lp-sm` | 12px | icon tiles, chips inside wells |
| `rounded-lp-md` | 18px | wells, media inside cards |
| `rounded-lp-lg` | 24px | default card |
| `rounded-lp-xl` | 32px | large feature / bento card |
| `rounded-full` | — | pills, dots, avatars |

Concentric rule: inner radius = outer radius − padding. Hand-typed
`rounded-[Npx]` is banned (device chrome in `DeviceFrames.tsx` is the only
allowlisted exception).

## 4. Rhythm

Three padding steps, expressed as classes — never hand-rolled `py-*` on a
section wrapper:

| Class | Mobile | Desktop | Used for |
|---|---|---|---|
| `.lp-rhythm-sm` | 56px | 64px | trust strip, compact bands |
| `.lp-rhythm` | 80px | 112px | standard section |
| `.lp-rhythm-lg` | 96px | 128px | feature section (Features, Pricing, Outcome) |

Section grounds alternate paper → soft → paper so the eye gets a beat, with the
ink/graphite anchors at the top (Hero) and bottom (Final CTA).

## 5. Heights

Card grids use `.lp-grid-stretch` so every card in a row is the same height.
Media inside cards uses an aspect ratio (`aspect-[16/10]`, `aspect-[4/3]`), never
a fixed pixel height. Decorative auras may use pixel sizes — they are not cards.

## 6. Guardrails

`src/test/landing-design-system.test.ts` fails the build on raw palette colours,
hand-typed pixel radii, hand-rolled section padding, retired classes, or missing
tokens. `src/test/brand-placement.test.ts` guards the one-accent-per-section rule.
