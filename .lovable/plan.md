

# Refine Overflow + Add Subtle Attention Layer

## Overflow Fixes

**Problem**: The Hero mockup's `perspective(1200px) rotateY(-4deg)` combined with `max-w-2xl` and the `initial={{ x: 40 }}` spring causes content to extend beyond the viewport on medium screens. The section has no overflow clipping.

**Fix 1 — Hero section**: Add `overflow-hidden` to the `<section>` element to clip any perspective overflow.

**Fix 2 — Hero mockup container**: The Framer Motion `style={{ transform: "perspective(...)" }}` conflicts with the `animate` transform. Framer Motion overrides `style.transform` when animating `x`. Wrap the perspective in a parent div so both transforms compose correctly:
- Outer div: `style={{ perspective: "1200px" }}`  
- Inner motion.div: animates `x`, `rotateY: -4`, `rotateX: 2` via Framer Motion props (not inline style)

This ensures the entry animation and the resting perspective both work without one overriding the other.

**Fix 3 — DashboardSvg bar widths**: The longest bar is `w: 340` starting at `x: 60` = 400. The container rect is `x: 16, width: 408` = 424. The bar sits within bounds but visually the 340px bar is quite long. Scale down bar widths proportionally so the longest bar is ~320 (fits comfortably within the 408-wide container with padding).

## Additional Animation Layer (additive, non-destructive)

**Concept**: A single soft radial glow behind each device frame that fades in ~200ms after the frame appears and then gently pulses once (opacity 0 → 0.06 → 0.03). Think of it as a subtle "spotlight" that lands on the illustration. This is what Apple does on their product pages — a diffused light bloom behind the product image.

**Implementation**: Add a `::before` pseudo-element (or an absolutely-positioned div) on the `GradientStage` wrapper that:
- Is a 80% width/height radial gradient circle, centered, using `rgba(39,39,42,0.06)` (charcoal at 6% opacity)
- Animates: `opacity: 0 → 1` over 1s, delayed 0.8s after section enters view
- One-shot, no loop
- `pointer-events: none`, `z-index: 0`

This draws the eye to the mockup without touching the SVGs at all. It's extremely subtle — just enough ambient light to create visual weight.

**Risk assessment**: Very low. It's a background glow behind existing elements. If it looks bad, removing it is a one-line delete.

## Files Modified (2)

1. **`src/components/landing/sections/Hero.tsx`** — Add `overflow-hidden` to section, fix perspective/animation composition
2. **`src/components/landing/DeviceFrames.tsx`** — Add ambient glow div inside `GradientStage` (affects all mockups automatically)

## What does NOT change
- All SVG illustrations (untouched)
- All text, copy, layout, spacing
- HowItWorks structure
- Any other section

