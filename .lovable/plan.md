

# Final $100K Elevation Pass — Typography, Spacing, Button Depth

## Current state vs. target

The page is already well-structured with the right palette, icons, and symmetry. This pass tightens three things:

1. **Headlines** — Several are still large enough to wrap on desktop. Scale down ~2-4px on mobile, ~4-6px on desktop.
2. **Spacing** — Cards already at `p-10` and sections at `py-28 md:py-36`, which is good. Heading `mb-16` stays. Only the Hero body and FinalCTA body need slightly more generous `leading`.
3. **Buttons** — Need stronger Fluent-style elevation. Currently `shadow-md hover:shadow-lg` on Hero primary and `shadow-sm hover:shadow-md` elsewhere. Upgrade to richer multi-layer shadows.

## Changes per file

### `Navbar.tsx`
- CTA: `shadow-sm hover:shadow-md` → custom richer shadow via `style` prop: `boxShadow: "0 2px 8px rgba(13,148,136,0.15)"` resting, hover `"0 4px 16px rgba(13,148,136,0.2)"`

### `Hero.tsx`
- h1: `text-[32px] md:text-[52px]` → `text-[28px] md:text-[46px]` (ensures single-line on ~1120px viewport)
- Body: already `text-[16px] md:text-[18px] leading-[1.6]` — no change
- Primary CTA: replace `shadow-md hover:shadow-lg` with richer `style={{ boxShadow }}` using teal-tinted shadows
- Secondary CTA: same treatment with neutral shadows
- Social proof line: `mt-6` → `mt-8` for more breathing room

### `TrustBar.tsx`
- No changes needed — already refined

### `Problem.tsx`
- Heading: `text-[26px] md:text-[38px]` → `text-[24px] md:text-[34px]`
- Card hover: add `hover:border-[#D4D1CC]` transition for subtle interactivity
- No other changes

### `HowItWorks.tsx`
- Heading: `text-[26px] md:text-[36px]` → `text-[24px] md:text-[32px]`
- Step title: `text-[22px] md:text-[26px]` → `text-[20px] md:text-[24px]`

### `Features.tsx`
- Heading: `text-[26px] md:text-[36px]` → `text-[24px] md:text-[32px]`

### `WhyOrdra.tsx`
- Heading: `text-[26px] md:text-[38px]` → `text-[24px] md:text-[34px]`
- Card hover: add `hover:border-[#D4D1CC]` transition

### `Testimonials.tsx`
- Heading: `text-[26px] md:text-[38px]` → `text-[24px] md:text-[34px]`

### `Pricing.tsx`
- Heading: `text-[26px] md:text-[38px]` → `text-[24px] md:text-[34px]`
- CTA buttons: upgrade to teal-tinted `boxShadow` on highlighted, neutral on others

### `FinalCTA.tsx`
- Heading: `text-[26px] md:text-[40px]` → `text-[24px] md:text-[36px]`
- CTA button: upgrade to premium teal-tinted `boxShadow` (deepest elevation on page)
- Body: `mt-6` → `mt-8`
- Button wrapper: `mt-10` → `mt-12`

### `Footer.tsx`
- No changes

## What does NOT change
- All text/copy verbatim
- Component structure, section order, card counts, icons, symmetry
- All Framer Motion animations
- Color palette, responsive breakpoints, grid layouts
- All Links, hrefs, routing
- Mockup content and device frames
- Card padding (already `p-10`), section padding (already `py-28 md:py-36`)

