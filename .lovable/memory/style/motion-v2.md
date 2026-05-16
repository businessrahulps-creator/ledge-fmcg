---
name: Motion System v2 — Choreographed Calm
description: Fluent 2 + M3 Expressive motion doctrine for the landing page — three ranks, named easings, scroll-scrubbed hero, 3D tilt on tinted cards, magnetic CTAs already in place via CapsuleCTA
type: design
---
**Doctrine (non-negotiable):**
1. Rank, then animate. `lead` / `support` / `ambient` — each rank has its own distance, blur, duration, ease, stagger. Never mix.
2. Easings are brand assets. Named cubic-beziers only. **Springs are forbidden for entrances** — they're only for direct manipulation (tap, magnetic, drag).
3. Distance scales with weight. Lead = 36px/12px blur/720ms emphasized. Support = 16px/4px/420ms decelerate. Ambient = 6px/0px/280ms decelerate.
4. Scroll is a timeline. Hero uses `useScrollScrub` to drive device lift (y 0→−64px) + ambient radial-gradient light drift (45%/42% → 58%/62%, opacity 0.7→0.2). Replaces one-shot reveals near the fold.
5. `prefers-reduced-motion` is the default ceiling — collapses to 200ms opacity-only fade, no transforms. Honored in `AnimateIn`, `Choreograph`, `useTilt`, and Hero scroll-scrub via `useReducedMotion` early-return.

**Tokens (keep in sync):**
- `src/lib/motion.ts` exports `ease.{decelerate,standard,accelerate,emphasized}`, `duration.{micro,short,medium,long,hero}`, `rank.{lead,support,ambient}`, `physics.{magnetic,drag,tap}`.
- `src/index.css` mirrors them as CSS custom properties: `--ease-*`, `--duration-*`, `--blur-1/2/3`.
- Legacy `spring.*` presets are kept for back-compat but should not be used in new entrances.

**Primitives:**
- `<AnimateIn variant="...">` — internally maps `blurFadeUp→lead`, `scaleUp|fadeUp→support`, `fadeIn→ambient`, applies the ranked duration+ease. Existing call sites get the upgrade automatically.
- `<Choreograph rank="lead|support|ambient" staggerChildren?>` — preferred for new code. Single source of truth.
- `useTilt(ref, { max, scale })` — RAF-throttled 3D tilt for premium cards (perspective 1200px, lerp 0.18, no rerenders). Applied to tinted Dealer Intelligence + Returns & Claims feature cards via local `<TiltCard>` wrapper. Auto-disabled on reduced-motion.
- `useScrollScrub(ref, offset)` — returns scrubbed 0→1 `MotionValue` for hero parallax / blur-decay / scale-decay. Returns constant 0 on reduced-motion.
- `CapsuleCTA` already wraps with `MagneticWrapper` — magnetic CTAs are live.

**Hero ambient signature:** the page's one ambient motion. Radial gradient `hsl(var(--primary) / 0.10)` drifts position + fades as the user scrolls past the hero. Built via `useMotionTemplate`.
