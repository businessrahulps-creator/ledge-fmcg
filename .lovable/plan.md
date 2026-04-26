
# Ledge Intelligence — premium announcement section

## Placement decision (recommended)
**Insert between `<Outcome />` and `<Founder />`** in `src/pages/Index.tsx`.
Rationale: creates a dramatic dark tonal break between two light sections (Apple-keynote rhythm), positions AI as bonus value *before* Pricing/CTA (strengthens close), and keeps FinalCTA as the clean closing moment. Placing at the very end would compete with FinalCTA and bury a future-tense promise as the last impression.

If you'd rather put it last, say the word — single-line change.

---

## Files

### 1. NEW — `src/components/landing/sections/LedgeIntelligence.tsx`
A single self-contained section. No new dependencies. Reuses `framer-motion`, `AnimateIn`, `StaggerContainer`/`StaggerItem`, `useParallaxY`, `spring.premium`, and our existing `lp-*` primitives.

**Structure (top → bottom):**
1. **Dark canvas** — `bg-[#0A0F1C]` with layered ambient: a soft indigo→violet radial wash, a faint `lp-grid-soft-dark` grid, a `lp-noise` film, and two slow-drifting parallax orbs (amber + indigo, very low opacity). Top and bottom edges fade to white via gradient masks so the section "lifts off" the page rather than slamming in.
2. **Eyebrow chip** — frosted dark pill: `[ NEW ] · Coming Q3 2026` with a pulsing indigo dot (variant of `lp-live-dot` tinted indigo).
3. **Headline** — `Ledge Intelligence` in `font-heading font-semibold`, 56–84px responsive, tracking `-0.03em`, white. The word **Intelligence** gets a *subtle* indigo→sky gradient text fill (matching our existing accent) — restrained, not rainbow.
4. **Sub-headline** — *"Your always-on **AI** that thinks alongside you."* Body white/70, 18–22px. The token "AI" rendered as an inline SVG glyph: a 1.4em tall capsule with a soft inner glow + a slow-pulsing core (3s breathing loop). This is what makes "AI" *visually* striking without resorting to giant rainbow type.
5. **Hero AI orb (centerpiece SVG)** — pure SVG, no images:
   - Radial-gradient core (indigo #4F46E5 → sky #0EA5E9 → transparent)
   - Two concentric soft rings rotating at different speeds (60s + 90s, opposite directions)
   - 6 light rays emanating, each fading in/out on staggered 4s loops (offset by 0.6s)
   - 4 orbiting micro-dots on elliptical paths (CSS transform, 8–14s loops)
   - Outer breathing aura (scale 1 → 1.04, 5s ease-in-out infinite)
   - All animations gated by `useReducedMotion()` — collapse to a static orb if user prefers reduced motion.
6. **4 capability cards** — 2×2 grid on desktop, stacked on mobile. Each card uses a dark variant of `lp-glass-frost` (`bg-white/[0.03]`, `border-white/[0.08]`, `backdrop-blur-xl`, top-edge indigo→sky highlight already in our CSS). Inside each:
   - Bracketed numeral `[ 01 ]`–`[ 04 ]` (reuse `lp-bento-numeral`, recolored white/40 via wrapper class)
   - Lucide icon in a small frosted square (Camera, Sunrise, Sparkles, Mic)
   - Title (white, 20px, semibold)
   - One-line description (white/65, 15px)
   - Subtle hover: `whileHover` translateY -3, border lifts to `white/[0.14]`, top highlight intensifies. Tactile, no cheap glow blast.

   Content (exact copy):
   - **[ 01 ] Photo-to-Order** — Turn handwritten chits into digital orders instantly.
   - **[ 02 ] Daily AI Briefings** — Every morning your team gets personalized dealer priorities.
   - **[ 03 ] Smart Scheme Suggestions** — AI recommends the right scheme for each dealer.
   - **[ 04 ] Dealer 360° + Voice Orders** — Full dealer health at a glance. Speak orders naturally.

7. **Footer strip** — centered, frosted dark capsule:
   `🎁  Existing customers get 6 months free when it launches`
   Tiny gold-tinted gift glyph (Lucide `Gift`), white text, `border-white/10`. No CTA button — this section is announcement-mode, not action-mode (FinalCTA does that job).

**Animation plan (all springs from `@/lib/motion`):**
- Headline + sub: `blurFadeUp` via `AnimateIn` with staggered delays (0, 0.12s).
- Orb: independent CSS/SVG animation loop (continuous, not scroll-tied).
- Cards: `StaggerContainer` (staggerTime 0.08) + `StaggerItem` (`fadeUp`).
- Background orbs: `useParallaxY(sectionRef, 40)` — soft scroll-tied drift.
- Reduced motion: orb static, parallax disabled, stagger fallback to fade only.

### 2. EDIT — `src/pages/Index.tsx`
Single import + single line insertion. Surgical:
```tsx
import { LedgeIntelligence } from "@/components/landing/sections/LedgeIntelligence";
// ...
<Outcome />
<LedgeIntelligence />   // ← new
<Founder />
```

### 3. EDIT — `src/index.css` (small additive block, ~25 lines, end of @layer components)
Three tiny scoped utilities so we don't bloat the file:
- `.li-orb-pulse` — keyframe `scale(1) → scale(1.04) → scale(1)` 5s ease-in-out infinite.
- `.li-ray` — opacity 0 → 0.7 → 0 over 4s, used 6× with negative `animation-delay`.
- `.li-card-dark` — dark frosted card variant (combines `bg-white/[0.03]`, border, top-edge highlight pseudo). Mirrors `lp-glass-frost::before` on dark.
- `.li-ai-glyph` — gradient text + inner glow for the inline "AI" token in the sub-headline.
All prefixed `li-` to avoid collisions; gated under `@media (prefers-reduced-motion: reduce)` to disable keyframes.

### 4. NO changes to
- Memory files (will not save; this is a single-section feature, captured in the file itself).
- Any other section, navbar, or theme config.
- Tailwind config (using existing arbitrary values `bg-white/[0.03]` etc.).

---

## Design guardrails (so we get it right in one shot)
- **Restraint over flash**: one orb, one gradient word, one pulse rhythm. No confetti, no neon, no animated gradient borders on cards.
- **Brand-native palette**: indigo `#4F46E5`, sky `#0EA5E9`, ink `#0A0F1C`, white. No new colors introduced.
- **Edge fades**: `bg-gradient-to-b from-white via-[#0A0F1C] to-white` mask at top/bottom 80px so the section feels like a *reveal*, not a slab.
- **Performance**: SVG only (no canvas, no three.js, no Lottie). All animations are CSS or framer-motion springs — no rAF loops.
- **Accessibility**: full `prefers-reduced-motion` honored; orb has `aria-hidden`; section has proper `<h2>`.
- **Mobile**: orb scales down to 240px, cards stack vertically with full-width frosted dark cards, headline drops to 44px.
- **No "distribution" word** anywhere — checked in copy above.

## What I am NOT doing (by design, to keep credit-safe)
- No CTA button in this section (avoids competing with FinalCTA).
- No new image assets (pure SVG keeps build clean).
- No memory write (one-off section; if you love it we can save the pattern later).
- No changes to other sections' rhythm.

After approval I'll execute all three file changes in one pass and stop.
