# Landing: contrast repair + scroll performance

Two problems, both real and both traced to specific code.

## 1. Colour is still leaking outside the system

The v4 design system defined honest tokens, but a few landing elements still
reach for the **app** palette instead of the landing one — that is why brown and
unreadable text still appear.

Confirmed causes (one per screenshot you sent):

| What you saw | Cause |
|---|---|
| "11:47 PM · Sunday" in brown on a white pill | `.lp-pill--warn` label/tile still resolve `--accent`, which is the app's terracotta. The `.lp-theme` block only overrides `--success` / `--warning` / `--bad`, never `--warn`. |
| Dark navy "REVENUE RECOVERED" on the blue card | The eyebrow uses `.text-accent`, which under `.lp-theme` is Electric blue — blue text on a blue card. The icon tile has the same problem. |
| Ledge wordmark almost invisible in the mobile nav | The nav capsule sits on the graphite hero, but the logo asset is dark ink and the capsule has no on-dark state. |
| Blue "Offline-ready" dot on the dark pill | Live dot uses Electric at full saturation against Ink — under 3:1. |

### Fix

- **Retire `--warn` as a pill variant.** Map every pill to the three honest
  states only: `success` (green), `warning` (amber), `bad` (red), plus
  `info` (Electric) and `neutral`. Repoint `Problem.tsx`'s late-night pill to
  `warning`. No landing rule may reference `--accent` again.
- **Dark-card foreground contract.** Inside `.lp-card--ink` / `.lp-card--accent`,
  `.text-accent` resolves to white (Ink cards keep Lime for a single highlight),
  icon tiles get a white-tinted surface, and dividers/muted text use the
  white-alpha ramp. This is a token override, so every current and future child
  inherits it — no per-component patching.
- **On-dark nav.** Add a `lp-nav--on-dark` state used while the navbar is over
  the hero: translucent ink capsule, white wordmark (CSS-inverted, no new asset),
  white text, and a brighter live dot. It swaps back to the light capsule once
  scrolled past the hero.
- **Dots and small marks on dark** move to a lightened Electric so they clear
  3:1.
- **Extend the guardrail test** (`landing-design-system.test.ts`) to fail on:
  `--accent` / `--warn` in landing CSS, and `text-accent` used on an accent card.
- Then a **full contrast sweep**: every text/background pair on the landing page
  checked to WCAG AA (4.5:1 body, 3:1 large/UI) at 390 / 768 / 1440.

## 2. The scroll glitch

Landing runs two live WebGL shader canvases (Hero and Final CTA), several
scroll-driven parallax layers, a `backdrop-filter` nav capsule, and grain
overlays — all repainting on the same scroll frames. On mid-range phones that
produces exactly the stutter you felt.

### Fix

- Measure first with a scripted scroll trace (long tasks, dropped frames,
  layer count) so the fixes are aimed, not guessed.
- Pause the shader whenever its section is off-screen and drop it to a single
  static frame on small viewports and on low-core devices.
- Move parallax layers onto compositor-only transforms with
  `will-change`/`contain`, and remove parallax below `md`.
- Replace scroll listeners that trigger layout with `IntersectionObserver`
  and passive `rAF`-throttled handlers; the navbar scroll state becomes an
  observer, not a per-frame read.
- Reduce `backdrop-filter` usage while scrolling (the most expensive per-frame
  effect on Safari).
- Re-measure and report before/after frame timings.

## Scope

Landing page only — everything stays inside `.lp-theme` and
`src/components/landing/**`. `/app` and its Fluent 2 system are untouched. No
backend or business-logic changes.
