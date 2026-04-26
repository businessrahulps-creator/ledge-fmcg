# World-Class Micro-Interaction Pass

**Scope guardrail:** Zero changes to copy, layout, palette, or visual hierarchy. Only interaction quality, motion physics, and the broken "90 days" animation. Everything additive — no existing class is removed.

---

## 1. Buttons — Magnetic, Springy, Alive (`CapsuleCTA` + Button)

**A. New `MagneticWrapper` primitive** — `src/components/landing/MagneticWrapper.tsx`
- Tracks pointer within an 80px radius of the element's bounding box.
- Translates child via Framer Motion `useMotionValue` + `useSpring` (`stiffness: 180, damping: 18, mass: 0.4`) — Apple-grade response curve.
- Max pull: **8px** (subtle, expensive — never cartoonish). Disabled on touch devices and when `prefers-reduced-motion: reduce`.
- Re-centers smoothly on `pointerleave`.

**B. Wrap `CapsuleCTA`** in `MagneticWrapper`. Keep all existing classes intact.

**C. Upgrade `.lp-capsule-cta` interaction layer in `src/index.css`:**
- Replace current `transform: translate(4px,-1px)` jump with a layered motion:
  - Inner: `translateY(-1.5px)` + slight `scale(1.012)` on hover, spring-eased.
  - **Liquid morph:** add a `::before` radial gradient (`radial-gradient(circle at var(--mx) var(--my), rgba(79,70,229,0.10), transparent 60%)`) that follows the cursor via two CSS vars (`--mx`, `--my`) set by a tiny pointer listener inside `CapsuleCTA`. Creates the "light follows finger" Apple feel.
  - **Shadow lift:** stack three shadows (contact 1px, mid 8px blur, ambient 28px blur indigo-tinted) — already partially there, refine the curve and add 60ms shadow delay on leave to feel weighty.
  - Arrow: spring-driven `x: 6` with subtle 0.08s lag behind the inner pill (cascading motion).
- **Ripple on click:** add `.lp-capsule-cta__ripple` span injected on `pointerdown` at click coords; 520ms scale 0→2.4 + opacity 0.35→0 with ease-out. Auto-removed.
- Press: `scale(0.985)` with `cubic-bezier(0.34, 1.56, 0.64, 1)` (subtle overshoot rebound).

**D. Shadcn `Button` (used in nav, secondary spots):** add a new `.btn-premium` utility (opt-in via className on landing usages) — soft spring hover lift, indigo focus ring bloom, identical ripple behavior. Apply only to landing-page buttons (Navbar CTA, Pricing CTAs, Final CTA fallback) — does not touch app/dashboard buttons.

---

## 2. Cards — Glass with Real Depth

**New utility `.lp-card-premium`** added to `src/index.css` (applied to existing card containers in `Features`, `Outcome`, `WhyLedge`, `HowItWorks`, `Pricing` — no markup restructure, just className addition):

- **Multi-layer shadow on hover** (4 stacked layers: contact, near, mid, ambient indigo bloom) transitioned over 420ms `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Spring lift** via Framer Motion `whileHover={{ y: -4 }}` with `{ type: "spring", stiffness: 260, damping: 22 }` — wrap card root with `motion.div` where currently a plain `div`. Replaces basic CSS scale. Retains existing visual styles entirely.
- **Border light sweep:** `::after` overlay — a thin diagonal gradient sheen (`linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)`) that translates `-100% → 100%` over 900ms on hover only (one-shot, not looping — looping = generic).
- **Inner glow:** `::before` radial that follows cursor via `--mx/--my` CSS vars (same pattern as buttons). Soft indigo (8% opacity), 280px radius. Creates "spotlight on glass" effect.
- **Border color shift:** `border-color` from `#ECEEF2` → `rgba(99,102,241,0.22)` over 280ms.
- All effects gracefully no-op under `prefers-reduced-motion`.

**Bento-hero cards:** keep existing `.lp-bento-hero:hover`, but add the same cursor-follow inner glow and spring lift wrapper for consistency.

---

## 3. Icons — Subtle Premium Motion

New `.lp-icon-premium` class on icon-tile containers in `Features`, `WhyLedge`, `HowItWorks` step badges:
- On parent card hover: `scale(1.06)` + `translateY(-1px)` + `rotate(-2deg)` over 380ms `cubic-bezier(0.34, 1.56, 0.64, 1)` (gentle Apple overshoot).
- Inner SVG stroke gets a 1px shadow bloom on hover (indigo, 4px blur).
- Decoupled from card lift via independent transition — creates layered feel (card moves first, icon follows ~80ms later via `transition-delay`).

---

## 4. Fix the "90 days" Pill (the user's specific complaint)

`.lp-pill-accent` currently runs **two infinite animations** (`lp-pill-breathe` 4.2s scale + `lp-pill-shimmer` 5.5s sweep). Always-on motion = restless and cheap.

**Fix:**
- Remove `animation: lp-pill-breathe` and `lp-pill-shimmer` from the always-on state.
- Trigger shimmer **once on scroll-into-view** only (via `whileInView` + Framer variants — single elegant pass, then static).
- Replace breathe with a **subtle, single-cycle "settle"** on mount: scale 0.96 → 1 with spring (damping 22, stiffness 220), holding still afterward.
- Keep the gradient + border styling untouched.

---

## 5. Scroll Choreography — Apple/Framer-Grade

**Refine `AnimateIn` (`src/components/landing/AnimateIn.tsx`):**
- Replace current `useInView({ once: true })` reveal (which is already decent) with a richer **`blurFadeUp` enhancement**: y from 28px, blur from 8px, opacity 0, with a smoother spring (`stiffness: 140, damping: 22, mass: 0.6`) — Framer Motion site-grade.
- Add staggered children **mass damping curve**: each subsequent item gets +30ms but also -2 stiffness, so trailing items feel heavier (Apple "natural settling" pattern).
- Section headlines get a **letter-by-letter blur reveal** via a new opt-in `<TextReveal>` component — applied only to top-level H2s in `Hero`, `Outcome`, `Features`, `Pricing`, `FinalCTA` (5 places, surgical). Each word: blur 6px → 0, y 8px → 0, 40ms stagger, spring eased. No copy changes.

**Section transition rhythm:** Add `useScroll` + `useTransform` opacity-and-y parallax (already partly used) to one decorative element per section so backgrounds breathe with scroll — already in place; expand to `Pricing` and `Features` mesh layers for consistency.

---

## 6. Cursor-Aware Glow (subtle global polish)

Tiny shared hook `useCursorVars(ref)` — sets `--mx` / `--my` CSS vars on the element from pointer move (throttled via `requestAnimationFrame`). Used by both `.lp-capsule-cta` and `.lp-card-premium`. ~30 lines, zero dependencies.

---

## 7. Reduced-Motion Discipline

Every new effect (magnetic pull, ripple, sheen, cursor glow, text reveal, spring lifts) is gated behind `useReducedMotion()` from Framer Motion or `@media (prefers-reduced-motion: reduce)`. Accessibility never compromised.

---

## Files Touched

| File | Change |
|---|---|
| `src/index.css` | `.lp-capsule-cta` ripple/morph upgrade; new `.lp-card-premium`, `.lp-icon-premium`, `.btn-premium`; fix `.lp-pill-accent` (remove infinite animations) |
| `src/components/landing/MagneticWrapper.tsx` | **NEW** — magnetic pointer wrapper |
| `src/components/landing/TextReveal.tsx` | **NEW** — word-by-word blur reveal for H2s |
| `src/components/landing/CapsuleCTA.tsx` | Wrap in `MagneticWrapper`, add cursor-vars + ripple injection |
| `src/components/landing/AnimateIn.tsx` | Refined spring, richer `blurFadeUp` |
| `src/lib/motion.ts` | Add `springs.premium`, `springs.overshoot`, refined `blurFadeUp` variant |
| `src/hooks/use-cursor-vars.ts` | **NEW** — cursor-position CSS variables hook |
| `src/components/landing/sections/*.tsx` | Add `.lp-card-premium` className to existing card containers; wrap H2s with `<TextReveal>` in 5 sections; remove the unnecessary `<motion.div>` already wrapping cards where it duplicates the new pattern (no markup change beyond className additions and 1-level wrapper swap) |

## What I am explicitly NOT changing
- No copy edits.
- No layout/grid changes.
- No color, palette, font, or spacing changes.
- No removal of `lp-glass-frost`, `lp-bento-hero`, `lp-proof-chip`, `lp-pricing-trust-chip`, etc.
- No changes to dashboard / app pages — landing only.

## Bonus suggestions (Apple/Framer-inspired) — included in this pass
- **Cursor-following light bloom** on glass cards (Framer.com pattern).
- **Cascading element motion** — arrow lags behind button by 80ms (Apple keynote pattern).
- **Spring-easing with subtle overshoot** for icons (`cubic-bezier(0.34, 1.56, 0.64, 1)` — Apple's default for delight moments).
- **One-shot sheen-on-reveal** instead of looping shimmer (premium > restless).
- **Scroll-triggered text reveal** with per-word blur (Framer Motion site signature).

Total net new dependencies: **0**. All built on Framer Motion + Tailwind already present.
