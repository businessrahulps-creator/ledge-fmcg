
# Ledge Intelligence — surgical reskin to "one-page" feel + FMCG-native motion

You're right on both counts:
1. The dark slab + top/bottom white blur reads as a **cutout**, not a section.
2. The rotating orb is a generic "AI" cliché — FMCG = **routes, stops, deliveries moving forward**, not orbits.

One pass. No new dependencies. No regressions to other sections.

---

## Decisions (locked)

**1. Background — join the page, don't break it.**
- Drop the dark `#0A0F1C` canvas entirely.
- Use the landing's existing **paper neutral** `lp-section-paper` (#FAFAFB) — same surface as Problem / Features / Testimonials. The section now sits in the page rhythm instead of on top of it.
- Remove both top and bottom white gradient masks (they're the "blur on top and below" you're calling out). With matching paper background, no fade is needed.
- Keep one ultra-soft indigo wash radial *behind the visual only* (not full-bleed) to give the section a focal point without a wallpaper effect — same restraint rule as the rest of the page.

**2. Palette — landing-native, indigo-accent-only.**
- Headings: `#0A0F1C` (ink). Body: `#475569`. Mute: `#94A3B8`. Hairlines: `#ECEEF2`.
- Accent: indigo `#4F46E5` only. Sky `#0EA5E9` allowed as the secondary stop in the route gradient (already used in `lp-progress-glass`).
- Cards switch from `.li-card-dark` (frosted-on-black) to **`.lp-glass-frost`** (the existing light frosted card used by Testimonials/HowItWorks). Identical primitive as the rest of the page → instant cohesion.
- Eyebrow chip: reuse the same pill style as TrustBar/Hero proof chips (white, hairline border, indigo dot) instead of the current dark frosted pill.
- Headline: solid ink `#0A0F1C` with the word **Intelligence** in indigo `#4F46E5` (single accent, no gradient text — matches our "no gradient text" memory rule in `landing-palette`).
- Special-offer strip: light frosted capsule with amber gift glyph (unchanged content, light treatment).

**3. The centerpiece — replace the orb with a "Live Route" SVG (FMCG-native).**
This is the headline change. Instead of rings spinning in place, we show **a salesperson's route advancing through stops** — exactly how FMCG actually moves.

What it is (pure SVG, ~280px tall, full-width container):
- A horizontal **route polyline** drawn left→right with gentle curves (3 control points), stroked in an indigo→sky gradient. Uses `stroke-dasharray` + animated `stroke-dashoffset` to **draw itself in 2.4s** on first view (IntersectionObserver-gated, fires once).
- **5 dealer stops** as small circles on the path — each one fades + scales in sequentially as the line passes (staggered 0.4s).
- A **moving "delivery pulse"** — a small bright dot that travels the path on a 6s loop using SVG `<animateMotion>` (or framer-motion `motionPath` fallback). Subtle indigo glow trails behind it via `filter: drop-shadow`.
- **3 floating mini "intelligence" chips** above the route (positioned absolute over the SVG), each labeled like a real signal:
  - `🌅 Morning brief ready` (indigo dot)
  - `📸 12 chits → orders` (indigo dot)
  - `🎯 Scheme suggested` (indigo dot)
  Each chip is a `lp-glass-frost` micro-card, fade/blur-up staggered with the route draw. They visually anchor the 4 capability cards below.
- **No** rotating rings. **No** orbiting dots. **No** breathing aura. **No** big glowing orb.
- Reduced-motion: route renders fully drawn, pulse static at midpoint, chips static. No keyframes.

Why this wins:
- Reads instantly as **forward motion** (left→right) — the language of beats, deliveries, sales calls, route plans.
- Light, restrained, expensive — same restraint dial as Hero.
- Mechanically reinforces the 4 capability cards beneath it (each chip ≈ a capability).

**4. Capability cards — light variant, same content.**
- Switch wrapper from `.li-card-dark` → `.lp-glass-frost` with `bg-white/80`.
- Numerals: keep `[ 01 ]` bracketed mono using existing `.lp-bento-numeral` (light variant, mute color) — matches the typographic thread already used across Problem/Features/Outcome.
- Icon tile: white surface, hairline border, indigo icon (matches Outcome cards).
- Hover: lift -3px + border darkens to `border-slate-200` (same as existing `.lp-card` hover).
- Promote ONE card to `.lp-bento-hero` (per our hierarchy rule "exactly one bento-hero per multi-card section"). **Pick `[ 01 ] Photo-to-Order`** — it's the most concrete, demo-able feature and earns the focal slot.

**5. Eyebrow + offer strip — light treatment.**
- Eyebrow: `[ NEW ]` bracketed mono + indigo `lp-live-dot` + "Coming Q3 2026" in mute uppercase tracking. White pill, hairline border. Same vocabulary as the rest of the page.
- Offer strip: light frosted capsule, amber `Gift` glyph, ink text with `6 months free` bolded.

---

## Files touched (3 total, all surgical)

### 1. EDIT — `src/components/landing/sections/LedgeIntelligence.tsx`
- Remove: dark bg, top/bottom white masks, ambient parallax orbs, soft grid, `lp-noise` overlay, `AIOrb` component (entire function), `li-headline-gradient`, `li-ai-glyph`, `li-card-dark` usage.
- Add: new `LiveRoute` SVG component (replaces `AIOrb`), light section wrapper using `lp-section-paper`, light eyebrow/headline/cards/offer-strip per spec above.
- Keep: section structure, `useParallaxY` import removed (no parallax orbs anymore), `AnimateIn`/`StaggerContainer`/`StaggerItem` (re-used), `Camera/Sunrise/Sparkles/Mic/Gift` icons.
- Net change: ~310 lines → ~240 lines, simpler.

### 2. EDIT — `src/index.css`
- **Delete** the now-unused: `.li-headline-gradient`, `.li-ai-glyph`, `.li-card-dark` (+ `::before`, `:hover`), `@keyframes li-ray-pulse`, `.li-ray`, and their entries in the `prefers-reduced-motion` block. Removes ~70 lines of dark-only CSS.
- **Add** (~25 lines): `.li-route-path` with `stroke-dasharray` draw animation, `.li-route-pulse` keyframe for the traveling dot's glow, `.li-route-chip` floating animation (very subtle 4s y±3px), all gated by `prefers-reduced-motion`.

### 3. NO change — `src/pages/Index.tsx`
Section stays in the same slot (Outcome → LedgeIntelligence → Founder). With matching paper background, the placement now reads as a natural beat rather than a tonal break — and that's the goal.

---

## What I am explicitly NOT doing
- Not moving the section to the end (you asked, I'd recommend keeping it where it is now: it answers "what's next" *before* Pricing closes the deal — moving it past FinalCTA buries the announcement).
- Not adding any new images, fonts, or libraries.
- Not touching memory files (one-pass refactor of one section).
- Not touching Outcome, Founder, or any other section.
- Not adding a CTA button (announcement mode, not action mode — FinalCTA owns conversion).

---

## Quality gates before I stop
- Visual: section background matches Problem/Features paper exactly → seamless.
- Motion: route draws once on enter, pulse loops, chips drift gently. No rotation anywhere.
- A11y: SVG `aria-hidden`, h2 intact, reduced-motion fully honored.
- Responsive: route SVG scales via viewBox; chips reposition for <640px (stack above route, not over it); cards stack 1-col on mobile.
- Build: zero unused CSS, zero unused imports.

Approve and I execute all three changes in one pass.
