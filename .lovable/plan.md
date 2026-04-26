# Subtle, accessible motion across landing sections

## Goal
Add tasteful, performant motion to the landing page — parallax mesh, hover lift on cards, and a CTA shimmer — without changing copy, layout, or color. Everything respects `prefers-reduced-motion`, runs on the GPU (transform/opacity only), and avoids layout thrash.

## Design principles
- **GPU-only**: animate `transform` and `opacity`. No `top/left/width/height/box-shadow` keyframes.
- **Reduced motion**: every effect short-circuits via `@media (prefers-reduced-motion: reduce)` and Framer's `useReducedMotion()`.
- **Cheap parallax**: Framer's `useScroll` + `useTransform` on a single mesh layer per section (translateY only, ±20–40px). No manual scroll listeners.
- **No re-layout**: hover lifts use `transform: translateY(-3px)` + soft shadow swap (already in `.lp-card:hover`). New scale only on icon tiles.
- **Shimmer = pure CSS**: a 1.2s linear gradient sweep on primary CTAs, triggered by hover. Single pseudo-element.

## Changes

### 1. `src/lib/motion.ts` — new helpers
- `useParallaxY(targetRef, range = 30)`: wraps `useScroll({ target, offset: ["start end", "end start"] })` + `useTransform([0,1], [-range, range])`. Returns `0` (static MotionValue) when `useReducedMotion()` is true.
- `hoverLiftSubtle = { whileHover: { y: -2 }, transition: spring.snappy }` for cards not already on `.lp-card`.

### 2. `src/index.css` — append three utilities near other `lp-*` classes
- `.lp-shimmer` — relative + overflow-hidden; `::after` is a 110° gradient sweep that translates `-100% → 100%` over 1.2s on hover.
  - Default sheen `rgba(255,255,255,0.18)` (works on dark CTA).
  - `.lp-shimmer-dark` variant `rgba(15,23,42,0.10)` for light CTAs on dark backgrounds.
- `.lp-icon-pop` — `transition: transform .4s cubic-bezier(.2,.8,.2,1)`. Parent `.lp-card:hover .lp-icon-pop { transform: translateY(-1px) scale(1.04); }`.
- Reduced-motion guard:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .lp-shimmer::after, .lp-icon-pop, .lp-card { transition: none !important; animation: none !important; }
    .lp-shimmer:hover::after { transform: translateX(-100%); }
  }
  ```

### 3. Parallax mesh — 4 sections
Wrap the existing background layer in `motion.div` with `style={{ y, willChange: "transform" }}`:
- **Hero**: parallax the `lp-grid-soft` dot layer, range `-30 → 20`. Mockup keeps its existing float.
- **Problem**: parallax the `lp-noise` overlay, range `-15 → 15` (subtle texture drift).
- **Outcome**: parallax the `lp-mesh-dark` background, range `-40 → 30`.
- **FinalCTA**: parallax `lp-grid-soft-dark`, range `-30 → 20`.
Mobile: skipped via `useReducedMotion()` OR a `useMediaQuery("(min-width: 768px)")` gate to keep mobile lightweight.

### 4. Hover lift audit on card grids
`.lp-card` already lifts on hover. For cards not on `.lp-card`:
- **Pricing.tsx**: confirm tier cards use `.lp-card`; if not, wrap in `motion.div` with `hoverLiftSubtle`.
- **Testimonials.tsx**: same audit on quote cards.
- **WhyOrdra.tsx**: same audit on comparison tiles.
- **Features.tsx** + **Problem.tsx**: already lift; add `lp-icon-pop` to icon containers for an extra micro-bounce.

### 5. CTA shimmer
Apply only to the two primary trial CTAs:
- **Hero.tsx** "Start 30-Day Free Trial" → add `lp-shimmer` to the `MotionLink`.
- **FinalCTA.tsx** "Start 30-Day Free Trial" → add `lp-shimmer-dark` (dark sheen on light button).
Secondary buttons (WhatsApp, "See How It Works") stay quiet.

### 6. Files to edit
- `src/lib/motion.ts` — add `useParallaxY` + `hoverLiftSubtle`
- `src/index.css` — append `.lp-shimmer`, `.lp-shimmer-dark`, `.lp-icon-pop`, reduced-motion guard
- `src/components/landing/sections/Hero.tsx` — parallax dot grid + shimmer on CTA
- `src/components/landing/sections/Problem.tsx` — parallax noise + `lp-icon-pop` on icons
- `src/components/landing/sections/Features.tsx` — `lp-icon-pop` on icons
- `src/components/landing/sections/Outcome.tsx` — parallax mesh
- `src/components/landing/sections/FinalCTA.tsx` — parallax grid + shimmer on CTA
- `src/components/landing/sections/Pricing.tsx` — verify/add hover lift
- `src/components/landing/sections/Testimonials.tsx` — verify/add hover lift
- `src/components/landing/sections/WhyOrdra.tsx` — verify/add hover lift

## Out of scope
- No copy, color, font, structural, or layout changes.
- No new section reveal animations (`AnimateIn` already handles those).
- No JS scroll listeners — Framer's `useScroll` only.

## Performance budget
- 4 `useScroll` instances total (one per parallax section) — negligible.
- All hover effects pure CSS — zero JS cost.
- Shimmer is a single GPU-composited pseudo-element.
- Reduced-motion users get a fully static page.