## Problem

On mobile (≤390px), the Hero eyebrow pill "THE OPERATING SYSTEM FOR FACTORY + FIELD" wraps to two lines. Because the dot (`::before`) is vertically centered against the full pill height, it ends up floating next to the first line while the second line ("FIELD") sits unaligned underneath — looks broken.

## Fix

Two small changes, scoped to mobile only so desktop stays untouched:

### 1. `src/index.css` — tighten `.lp-eyebrow` on small screens
Add a `@media (max-width: 480px)` rule that:
- Drops font-size to `10px` and letter-spacing to `0.14em` so the phrase fits on one line in most mobile widths.
- Sets `align-items: flex-start` and adds a tiny `margin-top` to the `::before` dot so if it ever does wrap, the dot aligns with the first line instead of floating mid-pill.
- Allows `text-align: left` and `line-height: 1.35` for clean wrapping as a fallback.

### 2. `src/components/landing/sections/Hero.tsx` — shorten copy on mobile (optional safety net)
Keep the existing full text on `sm:` and up. On the smallest screens, render a tighter variant so it never needs to wrap:

- Mobile (`<sm`): "OS FOR FACTORY + FIELD"
- Desktop (`sm+`): "THE OPERATING SYSTEM FOR FACTORY + FIELD"

Implemented with two spans toggled by Tailwind's `sm:hidden` / `hidden sm:inline`.

## Result

Eyebrow pill renders as a single clean line on 390px-wide viewports and below, with the indigo dot properly aligned. Desktop appearance is unchanged.

## Files touched
- `src/index.css` — add mobile media query for `.lp-eyebrow`
- `src/components/landing/sections/Hero.tsx` — responsive eyebrow text