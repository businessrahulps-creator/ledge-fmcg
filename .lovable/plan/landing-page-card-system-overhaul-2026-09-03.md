# Landing Page Card System Overhaul

Goal: kill the "grid of boxes" feel. Move the landing page to a soft, pillowy, visual-first card system in the spirit of the reference — large corner radii, generous padding, a real graphic in the top half of each card, and a short bold-lede caption underneath.

Scope is the **marketing landing page only**. The `/app` product keeps its 6px Fluent radius untouched.

## 1. Landing radius + surface scale

New landing-only tokens in `src/index.css` (they do not override `--radius`):

```text
--lp-r-sm   12px   inner chips, pills, mini rows
--lp-r-md   18px   nested panels, image wells
--lp-r-lg   24px   standard landing card
--lp-r-xl   32px   hero / bento feature card
```

Plus a softer shadow ramp (`--lp-shadow-soft`, `--lp-shadow-lift`) — wide, low-opacity, warm-tinted, no hard borders. Cards lose their 1px border and get an inset top highlight instead, which is what reads as "pillowy" in the reference.

## 2. Softer gradient range

Extend each brand family with tonal stops derived from the existing anchors (Midnight, Forest, Terracotta, Bone). Each tinted card becomes a two-stop diagonal gradient rather than a flat fill, with a soft radial bloom at the top. Still 100% derived from brand hues — no new colors introduced.

## 3. New card primitive: visual-first

A single `LandingCard` primitive with two slots:

```text
┌──────────────────────────┐
│                          │
│      VISUAL WELL         │  ~55% of card height
│   (chart / gauge / art)  │
│                          │
├──────────────────────────┤
│ Bold lede. Rest of the   │  2–3 lines max
│ sentence in muted tone.  │
└──────────────────────────┘
```

Caption style copies the reference exactly: first phrase in semibold foreground, remainder in muted, same line. Variants: `neutral | midnight | forest | terracotta | bone`.

## 4. Visual-first rebuild of the key cards

Each of these gets a purpose-built inline SVG/CSS visual (no stock imagery, no screenshots):

- **Features** — six cards, each with its own visual: dealer roster rows (exists, restyled), stock-health traffic gauge, scheme progress arc, team leaderboard bars, GST invoice stub, claim timeline (exists, restyled).
- **Outcome** — revenue recovered gets an area-chart well with a rising curve and a metric pill overlay.
- **LedgeIntelligence** — the route/pulse graphic gets rebuilt inside a proper visual well with soft gradient backing.
- **Problem** — "Excel Nights" gets a late-night ledger visual instead of a plain tinted box.
- **WhyLedge / Pricing / Testimonials** — shells softened, spacing rebalanced, tier card gets the new radius + gradient treatment.

Copy stays as-is; only the presentation changes.

## 5. Rhythm pass

- Vary card sizes: the current uniform grids get one dominant card per section (asymmetric bento), which is what breaks the "wall of boxes" impression.
- Retune section padding and grid gaps to the new radius scale (larger radii need larger gaps to breathe).
- Icon tiles move from 6px squares to `--lp-r-sm` squircles.

## 6. Motion

Keep the existing `PressableCard` / tilt behaviour but soften it: lift becomes shadow-driven rather than transform-heavy, so big rounded cards do not appear to skew. Respects `prefers-reduced-motion`.

## Technical notes

- All new tokens live in `src/index.css` under an `lp-*` namespace; `tailwind.config.ts` gets matching `rounded-lp-sm/md/lg/xl` utilities.
- No raw hex — gradients are `hsl(var(--primary) / …)` style derivations.
- Existing `lp-card-tinted`, `lp-pill`, `lp-insight` APIs are preserved so nothing outside the landing page breaks; their internals are re-tuned.
- `.glass-card` and every `/app` surface are untouched.
- New file: `src/components/landing/LandingCard.tsx`. New file: `src/components/landing/visuals/` for the per-card SVG visuals.

## Verification

Build check, plus a Playwright pass at 390px, 768px and 1440px capturing each section to confirm nothing overflows and the radii read consistently.
