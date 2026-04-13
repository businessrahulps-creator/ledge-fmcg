

# 100× Visual Elevation — Typography, Spacing, Buttons, Breathing Room

## Audit Summary

1. **Headlines too large** — `text-[60px]` hero, `text-[44px]` sections, `text-[48px]` FinalCTA all wrap on desktop. Need to clamp to single-line.
2. **Cramped spacing** — `py-24 md:py-32` is decent but card padding `p-8` and section `mb-20` don't create enough breathing room. Gap between sections feels uniform and flat.
3. **Text density** — Body `leading-[1.75]` is good but `text-base`/`text-[17px]` with tight paragraph spacing makes cards feel text-heavy.
4. **Buttons feel flat** — `rounded-2xl` with no shadow, no depth. Single-pixel hover scale. Need Fluent-level elevation.

## Changes per file (visual-only, zero text changes)

### All sections — Global rhythm
- Section padding: `py-24 md:py-32` → `py-28 md:py-36`
- Section heading mb: `mb-20` → `mb-16` (headings smaller now, need less gap)
- Card padding: `p-8` → `p-10`
- Card shadow resting: `0 1px 2px rgba(0,0,0,0.04)` → `0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)`

### `Navbar.tsx`
- CTA button: add `shadow-sm` and `hover:shadow-md` for depth

### `Hero.tsx`
- h1: `text-[34px] md:text-[60px]` → `text-[32px] md:text-[52px]` (fits single line)
- Body: `text-[17px] md:text-[20px]` → `text-[16px] md:text-[18px]` with `leading-[1.6]`
- Primary CTA: add `shadow-md hover:shadow-lg` for Fluent depth
- Secondary CTA: add `shadow-sm hover:shadow-md`
- Section padding: `py-24 md:py-32` → `py-28 md:py-36`

### `TrustBar.tsx`
- Stats text: `text-[20px] md:text-[24px]` → `text-[18px] md:text-[20px]`
- Pull quote padding: `p-8` → `p-10`
- Section padding increase

### `Problem.tsx`
- Heading: `text-[28px] md:text-[44px]` → `text-[26px] md:text-[38px]`
- Card title: `text-[20px]` → `text-[18px]`
- Card body: `text-base` → `text-[15px]` with `leading-[1.7]`
- Card padding: `p-8` → `p-10`
- Card shadow: elevated resting shadow

### `HowItWorks.tsx`
- Heading: `text-[28px] md:text-[44px]` → `text-[26px] md:text-[36px]`
- Step title: `text-[24px] md:text-[28px]` → `text-[22px] md:text-[26px]`
- Step body: `text-[17px]` → `text-[15px]` with `leading-[1.7]`
- Step spacing: `space-y-24` → `space-y-28`

### `Features.tsx`
- Heading: `text-[28px] md:text-[44px]` → `text-[26px] md:text-[36px]`
- Card title: `text-[20px]` → `text-[18px]`
- Card body: `text-base` → `text-[15px]` with `leading-[1.7]`
- Card padding: `p-8` → `p-10`

### `WhyOrdra.tsx`
- Same treatment as Problem cards: heading `md:text-[38px]`, card title `text-[18px]`, body `text-[15px] leading-[1.7]`, padding `p-10`

### `Testimonials.tsx`
- Heading: `text-[28px] md:text-[44px]` → `text-[26px] md:text-[38px]`
- Card padding: `p-8` → `p-10`
- Quote text: `text-base` → `text-[15px]` with `leading-[1.7]`

### `Pricing.tsx`
- Heading: `text-[28px] md:text-[44px]` → `text-[26px] md:text-[38px]`
- Card padding: `p-8` → `p-10`
- Feature text: `text-[15px]` stays
- CTA button in each card: add `shadow-sm hover:shadow-md`, highlighted card CTA gets `shadow-md hover:shadow-lg`
- Price font: `text-[36px]` → `text-[32px]`

### `FinalCTA.tsx`
- Heading: `text-[28px] md:text-[48px]` → `text-[26px] md:text-[40px]`
- Body: `text-[20px]` → `text-[18px]`
- CTA button: `px-8 py-4` → `px-10 py-4` + `shadow-lg hover:shadow-xl` for maximum premium depth
- Section padding increase

### `Footer.tsx`
- No changes needed (already calm and minimal)

## What does NOT change
- All text/copy verbatim
- Component structure, section order, card counts, icons
- All Framer Motion animations
- Color palette
- Responsive breakpoints and grid layouts
- All Links, hrefs, routing
- Mockup content and device frames

