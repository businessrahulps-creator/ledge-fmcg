# Ledge Intelligence — Single-Theme Polish (one-pass, surgical)

## What's wrong today
1. Bracketed numerals `[ 01 ]` and `[ NEW ]` chip — explicitly rejected pattern (see `mem://style/landing-palette`). They fragment hierarchy and read decorative.
2. Section feels like its own micro-system: custom eyebrow, custom card frosting, custom icon tile, custom offer pill — none of which match Outcome / Features / FinalCTA.
3. Route SVG dots are off the curve. I sampled the actual cubic Bézier — the real on-path coordinates are roughly `(40,140) → (130,117) → (420,110) → (612,55) → (820,150)`. Current stops `(240,122) (430,112) (620,96)` are floating in space. That's the "off" feeling.
4. The offer line is passive: *"Existing customers get 6 months free when it launches."* No urgency, no scarcity, no action.

## The fix — reuse the landing system, don't reinvent it

### 1. Strip the rejected decorations
- **Remove `[ 01 ]` `[ 02 ]` `[ 03 ]` `[ 04 ]`** from all four capability cards.
- **Remove `[ NEW ]`** from the eyebrow.
- Replace the eyebrow with the standard `.lp-eyebrow` chip used by every other section: `<span class="lp-eyebrow">Ledge Intelligence · Coming Q3 2026</span>` (small indigo dot + neutral chip, identical to "The Outcome", "Features", "Founder").

### 2. Match the rest of the page — typography & headline
- Headline size aligned to siblings: `text-[32px] md:text-[40px]` (currently 40→72, oversized vs Outcome's 40px). Same `tracking-[-0.022em] leading-[1.1]` rhythm.
- Replace `Ledge Intelligence` text with the **Outcome 90-days treatment**: keep "Ledge" in ink and wrap "Intelligence" in `.lp-pill-accent` (the animated indigo pill — the same earned-accent pattern used for "90 days"). One consistent "indigo moment" per section.
- Sub-headline: same `text-[17px] text-[#475569]` as Outcome's body line. Remove the indigo bracketed prominence on "AI" — instead, set the whole sub-headline ink and let the pill carry the accent.

### 3. Cards — adopt the Features grid system 1:1
- Switch from `.lp-glass-frost` to the **Features pattern**: `.lp-card lp-card-premium p-7` for the three secondary cards, and `.lp-bento-hero lp-card-premium p-7` for "Photo-to-Order" (the one earned hero tile per section, per landing rules).
- Icon tiles use the shared primitives: `.lp-icon-tile lp-icon-premium` (36×36, 17px stroke 1.75 lucide icon, ink color `#1F2937`). Same icon size, same stroke, same hover lift as Features. No more custom 44×44 indigo squares.
- Hero card uses the Features hero treatment: `lp-live-dot` + uppercase eyebrow `"Featured"` in `#3730A3`, headline + desc, and a small proof footer (e.g. *"Snap chit · Order drafts in seconds"*).
- Keep the four use cases & copy as-is; just re-skin.

### 4. Fix the route SVG — geometry, dots, motion feel
- **Recompute stops on-path** using the actual cubic samples:
  - `(40,140)` start
  - `(130,117)` early
  - `(420,110)` midpoint (cusp between segments)
  - `(612,55)` apex
  - `(820,150)` end
- **Stop styling refresh** to match landing palette (no more big halos):
  - Outer ring: 7r, fill `#FFFFFF`, stroke `#E2E8F0` 1.5
  - Inner dot: 2.5r, fill `#4F46E5`
  - Active stop (the one currently being passed by the pulse): same but inner 3r and a soft `box-shadow`-equivalent SVG `<circle r="14" fill="#4F46E5" opacity="0.08">` halo
- **Path stroke** keeps the indigo→sky gradient but reduce opacity to `0.85` and stroke width to `2` so it sits with the page's softness instead of shouting.
- **Pulse dot** keeps `<animateMotion>` 6s loop, but the dot becomes a tiny indigo orb (`r=5 fill=#4F46E5 stroke=#fff stroke-width=2`) with a faint trailing glow via SVG `<filter feGaussianBlur>`. Reduced-motion: pulse hidden entirely (don't keep a static dot mid-path — looks broken).
- **Floating chips** keep current copy, but switch from custom `lp-glass-frost` inline override to the **`.lp-proof-chip`** primitive (the neutral dark frosted chip used by the hero) — that's the page's canonical "floating intel" chip and instantly makes the section feel native. Icon color shifts to `text-[#94A3B8]` to match proof chip convention.

### 5. The offer capsule — urgency + animation + stronger copy
Current: passive single-line gift chip.

**New copy (with urgency, no over-promising):**
> **Founding 100 only** — lock in **6 months free** when Intelligence launches.
> *Today's customers are auto-enrolled. After 100 spots, this offer closes.*

**New treatment** (reuses page primitives, no custom CSS bloat):
- Wrap in `.lp-bento-hero` mini-card (rounded-2xl, soft indigo wash) — same surface as the hero capability tile, so the offer reads as a continuation, not a footer.
- Left: animated `.lp-live-dot` in indigo + uppercase eyebrow `LIMITED · FOUNDING 100`.
- Center: the two-line copy above, headline weight on "6 months free".
- Right: a small `<CapsuleCTA to="/signup" variant="dark" size="sm">Claim my spot</CapsuleCTA>` — the same component used in Hero/FinalCTA, so the CTA is recognized instantly.
- Subtle counter shimmer: `animate-pulse` on the live dot + a one-shot `blurFadeUp` on scroll-in. No flashy ticker (we don't have real signup data wired here).

This converts a decorative line into a real conversion surface, in the page's own visual language.

### 6. Micro-cleanups
- Section padding aligned with Features: `py-24 md:py-32 lg:py-36` (currently matches — keep).
- Background stays `lp-section-paper` ✅
- Remove the inline radial-gradient wash behind the SVG — the page already has `.lp-mesh-light` energy from neighbors; an extra wash here re-introduces the "cutout" feeling we just fixed. Let the chips and route carry the visual interest.
- Delete the unused `.li-route-chip-2 / -3` floating-chip CSS variants if they exist; consolidate to one `.li-chip-float` keyframe (≈10 lines saved in `index.css`).

## Files touched (surgical scope)
- **`src/components/landing/sections/LedgeIntelligence.tsx`** — full re-skin per above. No structural rewrite; same component shape, swapped primitives + corrected SVG coords + new offer block.
- **`src/index.css`** — only minor: remove unused chip variants, ensure `.li-route-path` and `.li-chip-float` remain. ~15 lines net reduction.
- **No** changes to `Index.tsx`, no new components, no new dependencies.

## My extra suggestions (your call — flag any you want included now)
1. **Anchor link** — add `id="intelligence"` so we can deep-link from the Navbar later (1 line, future-proof).
2. **Photo-to-Order proof image** — replace the hero card's text proof with a tiny inline SVG of a chit → order row arrow. Adds tangible "what does it look like" without a real screenshot. (≈30 lines SVG, optional.)
3. **A11y** — wrap the route SVG in `role="img"` with an `<title>` so screen readers say *"Live route across 5 dealer stops with traveling delivery pulse"*. Tiny win, do it now.
4. **Remove the standalone "Coming Q3 2026" line** — it's already in the eyebrow now, so we avoid repeating it. Cleaner.

## Acceptance criteria (so we don't iterate)
- ✅ Zero `[ NN ]` brackets and zero `[ NEW ]` chips anywhere in the section.
- ✅ Eyebrow, headline rhythm, body sizes, card chrome, icon tiles, and CTA capsule are visually indistinguishable from Outcome/Features when scrolled past quickly.
- ✅ All 5 route dots sit precisely on the curve at the sampled coordinates above.
- ✅ Offer block uses `.lp-bento-hero` + `CapsuleCTA` and reads with urgency.
- ✅ Reduced-motion: pulse hidden, route renders fully drawn, chips static.