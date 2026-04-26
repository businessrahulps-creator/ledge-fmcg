# Landing Page Spacing & Rhythm Refinement

Goal: take the current spacing from "templated" to "hand-crafted" by establishing a single, consistent vertical rhythm and container system across every section. **No copy, structure, colors, or component changes** — only padding, margins, gaps, and max-widths.

---

## Audit findings (current inconsistencies)

| Concern | Examples |
|---|---|
| Section padding varies | `py-24 md:py-32` (Problem, Features, Pricing, Testimonials, WhyOrdra, Founder, HowItWorks) vs `py-28 md:py-36` (Outcome, FinalCTA) vs `py-14 md:py-16` (TrustBar) vs `pt-32 pb-20 md:py-32` (Hero) |
| Header → grid spacing varies | `mb-14 md:mb-16`, `mb-12`, `mb-14`, `mb-16 md:mb-20`, `mb-20`, `mt-14`, `mt-12` |
| Eyebrow → H2 gap | Mostly `mt-5`, but inner padding inside chip varies; `mb-5` on eyebrow is unused since H2 uses `mt-5` (double-spacing risk) |
| Card grids | All use `gap-5` — good, but should bump to `gap-6` on `lg` for premium breathing room |
| Container widths | Mostly `max-w-6xl`, but TrustBar inner uses `max-w-5xl`, Testimonials grid uses `max-w-5xl`, FinalCTA `max-w-4xl`. Acceptable, but the horizontal gutter (`px-6`) should grow to `px-8 lg:px-10` for premium feel on wide screens |
| Hero | Asymmetric `pt-32 pb-20` on mobile creates a visual "lean"; grid `gap-12 lg:gap-10` shrinks at the wrong breakpoint (should grow) |
| Footer | `py-16` is too tight relative to surrounding `py-32` sections |
| Outcome closing line | `mt-16 md:mt-20` from grid is fine, but grid itself only has `mt-0` — needs more separation from header (`mb-16` is okay; closing line gap is fine) |

---

## Design tokens (the new rhythm)

Establish a **single vertical scale** that every section follows:

- **Section padding**: `py-24 md:py-32 lg:py-36` (light) / `py-28 md:py-36 lg:py-40` (dark / hero / final CTA — slightly more presence)
- **Horizontal gutter**: `px-6 md:px-8 lg:px-10`
- **Container**: `max-w-6xl mx-auto` (default), `max-w-5xl` only for narrow text blocks (Testimonials, FinalCTA)
- **Header → grid**: `mb-16 md:mb-20` (was a mix of 12/14/16/20)
- **Eyebrow → H2**: remove `mb-5` from eyebrow (H2 already has `mt-5`); use `mt-6` on H2 for slightly more air
- **H2 → subhead/grid**: `mt-6` for subhead, `mt-16 md:mt-20` for grids/CTAs
- **Card grids**: `gap-5 lg:gap-6`
- **Trailing CTA / closing line**: `mt-14 md:mt-16` (consistent everywhere)

---

## Per-section changes

### `Hero.tsx`
- Change `pt-32 pb-20 md:py-32` → `pt-28 md:pt-32 pb-24 md:pb-36` (balanced verticals)
- Add `lg:px-10` to outer
- Grid gap: `gap-12 lg:gap-16` (was `gap-12 lg:gap-10` — currently *shrinks* at lg)
- Headline `mt-6` → `mt-7`; sub-headline `mt-6` → `mt-7`; CTAs `mt-9` → `mt-10`; trust line `mt-7` → `mt-8`

### `TrustBar.tsx`
- `py-14 md:py-16` → `py-16 md:py-20` (currently feels cramped between Hero and Problem)
- Logos → stats spacing `mt-12 md:mt-14` → `mt-14 md:mt-16`
- Add `lg:px-10` to outer

### `Problem.tsx`, `Features.tsx`, `Testimonials.tsx`, `Pricing.tsx`, `WhyOrdra.tsx`, `Founder.tsx`, `HowItWorks.tsx`
- Standardize section padding → `py-24 md:py-32 lg:py-36`
- Header block bottom margin → `mb-16 md:mb-20` (currently 12/14/16/20)
- Outer container → add `md:px-8 lg:px-10`
- Card grids → `gap-5 lg:gap-6`
- Remove `mb-5` from eyebrow chips (H2 has its own `mt-5/6`)
- H2 `mt-5` → `mt-6` for slight extra air
- Subhead under H2 `mt-6` → `mt-6` (kept) but ensure `max-w-2xl mx-auto` for centered sections that don't already have it

### `Outcome.tsx` & `FinalCTA.tsx` (dark sections)
- Padding → `py-28 md:py-36 lg:py-40`
- Header block `mb-16 md:mb-20` (already good, keep)
- Outcome closing line `mt-16 md:mt-20` → `mt-20 md:mt-24` (give it more weight)
- Add `lg:px-10`
- FinalCTA buttons `mt-11` → `mt-10` (align with Hero rhythm)

### `Pricing.tsx`
- Header `mb-4` is a bug — currently relies on grid `mt-14` to compensate. Change header `mb-4` → `mb-16 md:mb-20`, and grid `mt-14` → `mt-0` (cleaner mental model)
- "Trial info" closing block `mt-12` → `mt-14 md:mt-16`

### `HowItWorks.tsx`
- Step row inner grid `gap-12` → `gap-12 lg:gap-16` (premium breathing on wide)
- Header `mb-20` → `mb-16 md:mb-20` (parity with siblings)

### `Footer.tsx`
- `py-16` → `py-20 md:py-24` (matches the surrounding rhythm; footer currently feels squashed)
- Bottom strip `mt-12 pt-8` → `mt-14 pt-10`
- Add `lg:px-10`

### `Founder.tsx`
- Already on the new scale; just bump grid `gap-10 lg:gap-16` → `gap-12 lg:gap-20` (founder section deserves the most breathing room — it's the human moment)
- Add `lg:px-10`

---

## Files touched (spacing-only edits)

- `src/components/landing/sections/Hero.tsx`
- `src/components/landing/sections/TrustBar.tsx`
- `src/components/landing/sections/Problem.tsx`
- `src/components/landing/sections/HowItWorks.tsx`
- `src/components/landing/sections/Outcome.tsx`
- `src/components/landing/sections/Features.tsx`
- `src/components/landing/sections/WhyOrdra.tsx`
- `src/components/landing/sections/Testimonials.tsx`
- `src/components/landing/sections/Founder.tsx`
- `src/components/landing/sections/Pricing.tsx`
- `src/components/landing/sections/FinalCTA.tsx`
- `src/components/landing/sections/Footer.tsx`

## Out of scope (explicit)

- No copy changes
- No new components, colors, gradients, or motion
- No structural/section-order changes
- No font-size changes (typography hierarchy stays as-is from the previous pass)
