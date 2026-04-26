## Diagnosis (what's "off" in your screenshot)

Looking at the hero in the screenshot, three things compound to make the bottom feel wrong:

1. **A visible horizontal gray band** sits at the very bottom of the hero — that's the `lp-vignette-top` strip (a 48px dark-to-transparent gradient pinned to `bottom-0` of the hero). It reads as a hard seam, not a transition.
2. **The hero is not actually full-viewport** — it's `min-h-[92vh]` with `pt-28 pb-36`. With `flex items-center`, the content lands visually above center and the area beneath the dashboard mockup is dead empty white space, so the eye says "this section ended early."
3. **The top haze is one-sided** — `lp-mesh-soft-warm` paints a soft warm ellipse only at the top. The bottom half is flat white with no closure, so the hero feels like it's floating, not landing.

A second, smaller issue: TrustBar has its own `border-y` divider directly underneath the hero's vignette, so we're double-printing a divider line.

## Fix plan (surgical, hero only)

### 1. Remove the visible bottom seam in `Hero.tsx`
- Delete the `<div className="absolute bottom-0 ... lp-vignette-top" />` element entirely. It's the gray band you're seeing.
- The hero will end on clean white that meets TrustBar's white background — no seam needed.

### 2. Make the hero a true full-viewport statement
- Change `min-h-[92vh]` → `min-h-screen`.
- Rebalance vertical padding: `pt-28 md:pt-32 pb-24 md:pb-36` → `pt-24 md:pt-28 pb-20 md:pb-24` so content sits optically centered (the 60px fixed navbar is already accounted for by `pt-24`).
- Keep `flex items-center` so the grid stays vertically centered in the new full-height frame.

### 3. Close the composition with a soft bottom haze
In `src/index.css`, extend `.lp-mesh-soft-warm` so the warm haze gently returns at the bottom — this gives the section visual closure without a hard line:
```css
.lp-mesh-soft-warm {
  background-color: #FFFFFF;
  background-image:
    radial-gradient(ellipse 90% 55% at 50% -10%, rgba(238,240,255,0.85) 0%, transparent 65%),
    radial-gradient(ellipse 100% 40% at 50% 110%, rgba(245,245,250,0.7) 0%, transparent 70%);
}
```
Both ellipses sit *outside* the visible area (at -10% and 110%), so they only tint the edges — no banding, no purple, no "wallpaper" feel.

### 4. Drop the duplicate divider on TrustBar
In `TrustBar.tsx`, change `border-y border-[#E5E7EB]/70` → `border-b border-[#E5E7EB]/60`. Removes the top border that was stacking against the hero's old vignette and creating the doubled line.

### 5. Tighten the dashboard mockup so it doesn't dominate the new full-height frame
With the hero now taller, the floating mockup needs slightly more presence at the bottom edge — increase the float amplitude marginally (`y: [0, -4, 0]` → `y: [0, -6, 0]`, same 8s duration) so it breathes with the larger canvas. No layout change.

## Files to edit
- `src/components/landing/sections/Hero.tsx` — remove vignette div, change min-height + padding, tweak float amplitude
- `src/index.css` — extend `.lp-mesh-soft-warm` with a second bottom ellipse
- `src/components/landing/sections/TrustBar.tsx` — `border-y` → `border-b`

## What stays untouched
- Typography, colors, button styling, copy — unchanged
- All other sections — unchanged
- The 3-layer mockup treatment (shadow → glass stage → browser frame) — unchanged
- Parallax dot grid — unchanged

## Outcome
The hero becomes a confident full-viewport opening with a soft, edge-only haze that closes the composition. The hard gray seam disappears. The transition into TrustBar reads as a single quiet hairline, not a band.