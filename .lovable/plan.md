## Motion v3 — "Stillness, then intent"

The current landing uses a respectable but generic SaaS pattern: every section fades+blurs+rises into view, cards lift on hover, a few magnetic CTAs, springs scattered throughout. It's correct, but it's the same vocabulary every Framer template ships with. Motion v3 throws out the "animate everything on scroll" reflex and adopts the discipline used by Apple, Linear, Stripe and Microsoft's Fluent 2: **most things don't move; the few that do, move with intent.**

### Principles (the rules the team agrees on)

1. **Stillness is the default.** No fade-up on body text, lists, pricing rows, FAQ, footer. Content is simply *present*. Motion is reserved for hero, section thresholds, and direct manipulation.
2. **One choreography per section, not per element.** A section reveals as a single composed scene with internal rank, not 12 independent `AnimateIn` wrappers.
3. **Easings are brand.** Keep the named Fluent/M3 curves; ban `ease-out`, `ease-in-out`, and all default Tailwind transitions on landing.
4. **Springs only on touch.** Hover, drag, tap, magnetic, scrub. Never on entrances. Entrances use cubic-beziers — they're predictable and feel "engineered."
5. **Scroll = scrub, not trigger.** Replace one-shot `useInView` reveals in the hero/showcase regions with `useScroll` + `useTransform` so motion is tied to the user's wheel, not a fire-and-forget timer. This is what makes Apple/Stripe feel "alive."
6. **Depth via parallax + blur, not shadow stacks.** Hero artwork, device frames, and watermarks gain 6–18px of parallax tied to scroll. Background watermarks gain a 0.5–2px blur differential to suggest atmosphere.
7. **One pointer-reactive layer per viewport.** A single ambient cursor-follow gradient on Hero (not magnetic buttons everywhere). Reduces noise, increases impact.
8. **Transitions between sections, not just into them.** Section boundaries get a 1-frame "settle": the outgoing section's content desaturates ~4% and the incoming section's first element lights up. Adds continuity.
9. **Reduced motion = real reduced motion.** No fades either — just instant presence with a 120ms opacity tween. Today we collapse to 200ms; v3 goes further.
10. **Performance budget.** No layout-affecting animations. Only `transform`, `opacity`, `filter`. `will-change` set per-frame, removed on completion. Target: 0 jank at 60fps on a mid-range Android, <2% main-thread time per scroll frame.

### What ships

**A. New motion tokens (`src/lib/motion.ts`)**
- Add `scrub` group: `parallax.subtle` (6px), `parallax.medium` (14px), `parallax.deep` (28px), `blur.atmos` (0→2px), all consumed via `useScroll` helpers.
- Add `scene` rank above `lead` for hero-only choreography (longer duration 1.1s, emphasized ease, larger blur).
- Deprecate `spring.bounce` and `spring.overshoot` on the landing — too "playful" for enterprise.
- Add `hover.intent` (120ms standard ease, 1px lift + 1% scale) — replaces today's 4px lift+spring.

**B. New primitives (`src/components/landing/`)**
- `Scene.tsx` — wraps a whole section; orchestrates one ranked reveal with internal `delayChildren` instead of N `AnimateIn`s. Built on `Choreograph` but exposes named slots (`<Scene.Lead>`, `<Scene.Support>`, `<Scene.Ambient>`).
- `Parallax.tsx` — `useScroll`-driven y/blur for hero artwork, device frames, watermarks. Respects reduced motion. GPU-only.
- `CursorAura.tsx` — single radial gradient bound to pointer via `useMotionValue` + spring, rendered once on Hero. Pointer-events: none.
- `ScrollScrub.tsx` — small wrapper that maps section progress (0→1) to a child's transform/filter. Used for the "How it Works" steps so the active step actually tracks the scroll, not just snaps in.
- `PressableCard.tsx` — replaces ad-hoc `whileHover`/`whileTap` across pricing/feature cards with a single 120ms standard-ease lift + tap. Same component everywhere = consistent rhythm.

**C. Section-by-section choreography**

| Section | Today | Motion v3 |
|---|---|---|
| Hero | TextReveal word stagger + 4 `AnimateIn`s + magnetic CTAs | One `Scene` reveal (1.1s emphasized), TextReveal kept but at 30ms stagger, CursorAura behind, device frame + watermark on Parallax, magnetic on primary CTA only |
| TrustBar | Per-logo fade-up | Stillness. Logos present on load. Optional 40ms opacity-only stagger. |
| Problem | Cards fade-up | Stillness for body; the connecting underline scrub-draws across as you scroll the section |
| HowItWorks | Step cards fade in | ScrollScrub: the active step lights up; inactive steps desaturate to 60% and lose 1px of blur on hover only |
| Features / WhyLedge | Per-card fade-up | One Scene per grid, 30ms stagger, internal mini-previews stay still (they're already busy) |
| Outcome / numbers | Count-up on view | Keep count-up but tie progress to scroll position (scrub), not a 2s timer |
| Pricing | Per-card fade-up | Stillness. PressableCard for hover. Highlighted card gains a slow 6s breathing glow (opacity 0.6↔1) — the one "delight" on the page |
| Testimonials / Founder | Fade-up | Stillness. Quote marks parallax 6px on scroll. |
| FinalCTA | Fade-up + magnetic | Scene reveal once; CursorAura returns; CTA gets press + magnetic |
| Footer | Fade-up | Stillness, period. |
| Navbar | Existing | Add 200ms standard-ease background blur transition on scroll past 24px (already partially there — formalize via tokens) |

**D. Cleanup / removals**
- Remove `AnimateIn` usage from ~70% of call sites (replaced by `Scene`).
- Remove `MagneticWrapper` from all secondary CTAs, keep on Hero primary and FinalCTA primary only.
- Delete stray `transition-all` and Tailwind default `duration-300` classes; replace with token-driven utilities (`transition-[transform,opacity,filter] duration-[180ms] ease-[var(--ease-standard)]`).
- Audit `whileHover`/`whileTap` inline props on cards and unify under `PressableCard`.

**E. Verification**
- Open landing in preview at 1280 and 390 viewports; capture screen replay; confirm: no element animates more than once, no fade-up on body content, hero scrub works on wheel, reduced-motion media query collapses everything to instant.
- Performance: Chrome perf trace over a full landing scroll; verify <2% long-task time and no layout/paint inside motion frames.
- Build passes; no new dependencies (everything is framer-motion + existing tokens).

### Technical notes (for the engineer, skippable for product)

- `useScroll({ target, offset: ["start end", "end start"] })` per section; pipe through `useTransform` with `clamp: true`. Avoid `useSpring` on scroll-driven values — adds latency.
- `Scene` uses `staggerChildren` + `delayChildren` from the rank tokens, eliminating per-child `useInView` observers (one IO per section instead of dozens).
- `CursorAura` uses two `useMotionValue`s wrapped in soft springs (stiffness 80, damping 20) for buttery follow without snapping.
- All `filter: blur()` animations gated behind `@media (prefers-reduced-transparency: no-preference)` and a `matchMedia('(min-width: 768px)')` check — mobile skips blur to save GPU.
- `will-change` toggled via `onAnimationStart`/`onAnimationComplete`, never left on permanently.

### Out of scope
- No copy changes, no layout changes, no new sections, no color/typography changes.
- No swap of framer-motion for GSAP/Motion One.
- Mobile menu, splash screen, and `/app` (post-login) motion remain untouched.

### Rollout
Single PR. After the primitives land, each section is migrated in the same pass so the page never lives in a half-old/half-new state.
