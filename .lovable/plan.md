

# Landing Page Animation & Micro-Interaction Overhaul

## Audit Findings

### Current State
Every section uses the same `AnimateIn` component: `opacity: 0 → 1, y: 12 → 0` with identical spring `(damping: 26, stiffness: 200)`. The Hero uses the same spring inline. There are zero hover animations on cards (only CSS `transition-all duration-300` for border color). Buttons use inline `onMouseEnter/onMouseLeave` for shadow changes — no spring physics, no scale feedback. The marquee runs at a fixed 30s with no pause. The dashboard mockup has a nice perspective entrance but nothing else has depth or parallax. The navbar has no entrance animation.

**In short**: the entire page has one animation — fade-up — applied uniformly everywhere. It feels monotonous, predictable, and generic.

### What Premium SaaS Sites Do Differently
- **Layered entrance timing**: Hero text appears first, then mockup slides in separately — creating a choreographed sequence
- **Scroll-velocity-aware reveals**: Elements further down the page use slightly different motion signatures (scale, blur) to maintain interest
- **Card hover lift**: Cards physically "lift" on hover with shadow deepening + subtle scale — feels tactile
- **Button press feedback**: Buttons scale down slightly on press (`whileTap: { scale: 0.98 }`) — instant, physical
- **Staggered children**: Card grids stagger their children with container variants, not individual delays
- **Navbar entrance**: Slides down with a slight delay after page load
- **Parallax depth on mockups**: Mockup images shift slightly on scroll — adds depth without being distracting

---

## Animation System Design

### Spring Presets (reusing `src/lib/motion.ts`)
Already defined but **not used anywhere on the landing page**. Will wire these in:
- `spring.default` — `damping: 26, stiffness: 200` (current, keep for reveals)
- `spring.snappy` — `damping: 20, stiffness: 300` (buttons, hovers)
- `spring.gentle` — `damping: 30, stiffness: 150` (large mockups, parallax)

### Motion Signatures
| Element | Current | New |
|---------|---------|-----|
| Section headings | fadeUp(12px) | fadeUp(20px) + slight blur clear |
| Card grids | Individual AnimateIn delays | Staggered container variant (40ms) |
| Cards on hover | CSS border-color only | `motion.div` with `whileHover={{ y: -4, shadow }}` |
| All CTA buttons | Inline JS shadow swap | `motion` with `whileTap={{ scale: 0.97 }}` + `whileHover={{ scale: 1.02 }}` |
| Hero mockup | Perspective slide | Add subtle `whileInView` parallax shift |
| Navbar | No animation | Fade-in on mount, `y: -10 → 0` |
| Testimonial cards | Same as everything | Slight scale-in (0.97 → 1) + fade |
| Pricing cards | Same fade-up | Stagger + hover lift |
| FinalCTA | Single AnimateIn | Sequenced: heading → subtitle → buttons → trust line |

### GPU-Only Properties
All animations will use only `transform` (translate, scale) and `opacity`. No animating `width`, `height`, `padding`, or `box-shadow` via Framer Motion — shadow changes stay as CSS transitions.

---

## Implementation Plan

### Pass 1 — Core Animation Infrastructure (2 files)

1. **`AnimateIn.tsx`** — Upgrade to support variants:
   - Add optional `variant` prop: `"fadeUp"` (default), `"scaleUp"`, `"fadeIn"`
   - `scaleUp`: `{ opacity: 0, scale: 0.97, y: 8 } → { opacity: 1, scale: 1, y: 0 }`
   - Add optional `blur` prop that adds `filter: blur(4px) → blur(0px)`
   - Export a `StaggerContainer` wrapper that uses `staggerContainer` from `motion.ts`

2. **`motion.ts`** — Add missing variants:
   - `scaleUp` variant
   - `blurFadeUp` variant (opacity + y + filter blur)

### Pass 2 — Hero & Navbar (2 files)

3. **`Navbar.tsx`** — Add entrance animation:
   - Wrap in `motion.nav` with `initial={{ opacity: 0, y: -10 }}`, `animate={{ opacity: 1, y: 0 }}`, `spring.default`

4. **`Hero.tsx`** — Choreographed entrance:
   - Tighten stagger: h1 (0s) → p (0.12s) → buttons (0.2s) → footnote (0.28s) — faster, more purposeful
   - Add `whileTap={{ scale: 0.97 }}` to both CTA buttons via `motion(Link)` / `motion.a`
   - Add `whileHover={{ scale: 1.02 }}` to primary CTA
   - Dashboard mockup: add gentle floating animation (`y: [0, -6, 0]` loop, 6s, gentle spring)

### Pass 3 — Card Sections (4 files)

5. **`Problem.tsx`** — Switch from individual `AnimateIn` delays to `StaggerContainer` + child `AnimateIn` with no explicit delay (stagger handles timing). Add `whileHover={{ y: -4 }}` with `spring.snappy` to each card.

6. **`Features.tsx`** — Same stagger treatment. Add hover lift to cards.

7. **`WhyOrdra.tsx`** — Same stagger + hover lift.

8. **`Testimonials.tsx`** — Use `scaleUp` variant for testimonial cards instead of `fadeUp` to differentiate. Add hover lift.

### Pass 4 — Sequenced Sections (3 files)

9. **`HowItWorks.tsx`** — Keep individual AnimateIn per step (they're large blocks, not a grid). Add subtle `whileInView` parallax to mockup images: `y: 20 → 0` with `spring.gentle`.

10. **`Pricing.tsx`** — Stagger the 4 pricing cards. Add `whileHover={{ y: -4 }}` lift. Add `whileTap={{ scale: 0.97 }}` to all CTA buttons.

11. **`FinalCTA.tsx`** — Sequence: heading (0s) → paragraph (0.1s) → buttons (0.18s) → trust line (0.24s). Add `whileTap` to buttons.

### Pass 5 — Polish (3 files)

12. **`TrustBar.tsx`** — Add `hover:pause` to marquee via `[&:hover]:animation-play-state: paused` in Tailwind. Stagger the stat row.

13. **`Footer.tsx`** — Add staggered fade-in to footer columns. The status badge shimmer is already good — keep it.

14. **`tailwind.config.ts`** — Add `marquee` pause-on-hover utility if not present.

### What Does NOT Change
- All existing `className` values preserved
- All data, copy, links, and component structure untouched
- No new features, no new components beyond `StaggerContainer` export
- All colors, spacing, typography unchanged
- Button shadow CSS transitions stay as CSS (not Framer Motion)

**Total**: ~14 surgical edits across ~12 files. Every animation uses GPU-accelerated properties only. All springs use the presets from `motion.ts`.

