# Motion System v2 — "Choreographed Calm"
*A discipline borrowed from Microsoft Fluent 2 + Google Material 3 Expressive, retuned for Ledge.*

## The diagnosis

Current landing uses a fine framer-motion toolkit (`src/lib/motion.ts`: 6 springs, 5 variants, hoverLift/ctaHover) — but it's applied **uniformly**: nearly every section opens with the same `blurFadeUp` whileInView, every card scales 1.02 on hover, every CTA taps to 0.97. That's the "common SaaS" smell. Premium apps do the opposite — they **rank** elements and animate them differently based on importance, distance, and intent.

Hero alone calls `motion.` 24 times; total across sections = 137 instances of 8 patterns. Most of those patterns are interchangeable. We're paying the motion budget without buying personality.

## The new doctrine (5 rules, non-negotiable)

1. **Rank, then animate.** Every element gets one of three ranks. Hero/headline = `lead`. Body card = `support`. Decoration = `ambient`. Each rank has its own curve, duration, distance, blur, and stagger. Mixing them is forbidden.
2. **Easing is a brand asset.** Replace generic `ease-out` everywhere with **two named curves**: `ease-fluent-decelerate` (0.1, 0.9, 0.2, 1) for entrances, `ease-fluent-standard` (0.8, 0, 0.2, 1) for swaps. Springs only for direct manipulation (drag, tap, magnetic hover) — never for entrances. This is the Fluent 2 rule.
3. **Distance scales with weight.** Lead moves 36px + 12px blur over 720ms. Support moves 16px + 4px blur over 420ms. Ambient moves 6px + 0 blur over 280ms. A small chip should never travel as far as a hero headline — that's what makes pages feel "noisy."
4. **Scroll is a timeline, not a trigger.** Replace one-shot `whileInView` reveals for hero-adjacent content with scroll-linked transforms (`useScroll` + `useTransform`): blur decays from 12→0, scale from 0.98→1, opacity from 0→1 across the first 30% of the viewport's intersection with the element. This is the Material 3 Expressive "container transform" feel.
5. **Reduced motion is the default ceiling.** All transforms ≤ 28px, all blurs ≤ 12px, all durations ≤ 720ms. `prefers-reduced-motion` collapses every animation to a 200ms opacity fade — no exceptions, no `if` chains in components.

## What ships

### 1. Motion token layer — `src/lib/motion.ts` (rewrite)

```ts
export const ease = {
  decelerate:  [0.1, 0.9, 0.2, 1],   // entrances
  standard:    [0.8, 0, 0.2, 1],     // swaps / layout
  accelerate:  [0.7, 0, 1, 0.5],     // exits
  emphasized:  [0.05, 0.7, 0.1, 1],  // hero moments (M3 Expressive)
};

export const duration = {
  micro: 0.18, short: 0.28, medium: 0.42, long: 0.72, hero: 1.0,
};

export const rank = {
  lead:    { y: 36, blur: 12, scale: 0.96, duration: duration.long,   ease: ease.emphasized, stagger: 0.08 },
  support: { y: 16, blur: 4,  scale: 0.98, duration: duration.medium, ease: ease.decelerate, stagger: 0.05 },
  ambient: { y: 6,  blur: 0,  scale: 1,    duration: duration.short,  ease: ease.decelerate, stagger: 0.03 },
};

// Springs ONLY for direct manipulation
export const physics = {
  magnetic: { stiffness: 260, damping: 24, mass: 0.4 },
  drag:     { stiffness: 180, damping: 22, mass: 0.6 },
};
```

### 2. `<Choreograph rank="lead|support|ambient">` primitive

Replaces `<AnimateIn>` everywhere. Reads the rank token, applies entrance via `whileInView` for sections OR scroll-linked transforms when `mode="scrubbed"`. Internally handles `useReducedMotion` → 200ms opacity-only fade. No per-component motion props in section files anymore — they just pick a rank.

### 3. Scroll-linked hero & section transitions

- **Hero:** scroll-scrubbed parallax — headline drifts up 40px, eyebrow blurs from 0→6px, device frame scales 1.0→0.94 over the first 60vh of scroll. Replaces the current one-shot reveal.
- **Sticky section transitions:** each section's heading sticks for ~20vh while body cards stream in below — gives a Linear/Vercel-style "panel" feel without sticky overflow bugs.
- **Backdrop blur on Navbar:** drive `backdropFilter: blur(Npx)` from a `useScroll` motion value (8 → 22px) instead of toggling a class. Continuous depth, not a step.

### 4. Magnetic interactions (replace generic hover-scale)

Two new hooks:
- `useMagnetic(ref, { strength, radius })` — pulls element toward cursor with spring physics. Apply to **CTAs and primary cards only**.
- `useTilt(ref, { max: 6 })` — 3D tilt with perspective on the **3 tinted feature cards** (Midnight/Forest/Terracotta). Replaces flat `y: -4` lift. Gated by `prefers-reduced-motion`.

Delete blanket `hoverLift`/`ctaHover`/`hoverLiftSubtle` from all secondary cards — they get a 1px shadow lift via CSS transition only. **Motion is rationed; not every element gets to move.**

### 5. Cross-element choreography

- **Stagger from anchor:** a section's stagger origin is its heading, not its DOM order. Cards closer to the heading animate first, ripple outward. Uses `custom` prop + `distance-from-anchor` math.
- **Shared-axis transitions** for Pricing tier toggle (Monthly ↔ Annual) and Founder tab swaps — slide + fade on a single axis (Material 3 pattern), not crossfade.
- **View Transitions API** for `/` → `/login`, `/signup`, `/reset` route changes when supported. CSS-only progressive enhancement, no library.

### 6. Transparency & depth pass

- Codify three depth tiers with named tokens already in CSS: `--blur-1: 8px`, `--blur-2: 16px`, `--blur-3: 24px`. Navbar uses 3, cards use 2, chips use 1. No ad-hoc `backdrop-blur-xl` strings.
- Add `--noise-mask` overlay (existing `.lp-noise`) to all blurred surfaces at 4% opacity — kills the "plastic" look that pure backdrop-blur gives on big surfaces.
- Hero gets a soft `radial-gradient` color-bleed light that drifts 2% on scroll (parallax light), 18s loop. Single ambient motion the page has. (Currently we have none — the page feels static between sections.)

### 7. Audit & deletions

Rip out:
- Every `whileHover={{ scale: 1.02 }}` on non-CTA elements (≈ 14 instances).
- Duplicate `fadeUp`/`blurFadeUp` calls inside sections that already wrap children in a staggered container (≈ 9 instances).
- `bounce` and `overshoot` spring presets — Fluent forbids overshoot on entrances. Keep `magnetic` + `drag` only.
- Any `transition-all duration-300` Tailwind on landing — replaced with explicit `transition-[transform,box-shadow] duration-[var(--duration-short)] ease-[var(--ease-decelerate)]`.

## Files touched

**Rewrite:** `src/lib/motion.ts`, `src/components/landing/AnimateIn.tsx` → renamed `Choreograph.tsx`.
**Create:** `src/lib/hooks/useMagnetic.ts`, `src/lib/hooks/useTilt.ts`, `src/lib/hooks/useScrollScrub.ts`.
**CSS tokens:** add `--ease-decelerate`, `--ease-standard`, `--ease-emphasized`, `--duration-*`, `--blur-1/2/3` to `src/index.css :root`.
**Section edits (motion swap only, no JSX restructure):** Hero, TrustBar, Problem, WhyLedge, Features, HowItWorks, Outcome, LedgeIntelligence, Testimonials, Pricing, Founder, FinalCTA, Footer — replace `<AnimateIn variant=...>` with `<Choreograph rank=...>`, delete redundant per-element motion, opt in to scroll-scrubbed mode on Hero + LedgeIntelligence.
**Navbar:** swap class-based scroll toggle for `useScroll`-driven backdrop blur motion value.

## What this buys

- **Recognizable.** The page has *one* motion fingerprint — emphasized decelerate, blur-decay, magnetic CTAs — instead of seven generic ones. Users feel "this is Ledge" before reading copy.
- **Disciplined.** Three ranks × two curves × three durations = a designer's grid, not a free-for-all. New sections will animate consistently by construction.
- **Cheap.** Removes more motion than it adds. Total framer-motion instances drop from ~137 to ~60. JS heap and main-thread work go down.
- **Accessible.** One global reduced-motion path, audited once, not 14 component-level checks.

## Out of scope

- No new colors, fonts, layouts, copy, or sections.
- `/app` interior pages keep their existing Fluent 2 motion — this is landing-only.
- No GSAP, Lenis, or Locomotive — pure framer-motion + CSS. We already have the tools; we just need to use them with intent.

## Verification

1. Scroll Hero → Features at 60fps in DevTools Performance panel; check that scroll-scrubbed Hero stays on compositor (no layout/paint per frame).
2. Toggle `prefers-reduced-motion` — every animation collapses to a 200ms opacity fade, no transforms.
3. Visit at 1440 / 1024 / 390 — three ranks remain distinguishable; no element travels > 36px.
4. Hover CTAs — magnetic pull engages within 80px radius, releases on exit.
5. Tab through nav links — focus rings appear instantly (no animated focus).
6. Navigate `/` → `/login` in Chrome — View Transition fade-through plays.
