

# Build Testimonials Section

Replace `src/components/landing/sections/Testimonials.tsx` with a 2×2 testimonial card grid.

## File: `src/components/landing/sections/Testimonials.tsx`

**Section wrapper:** `bg-cream py-16 md:py-32`

**Headline:** `font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]` — "Our product speaks for itself."

**Grid:** `grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto`

**Each card** (wrapped in `AnimateIn`, delay `i * 0.1`):
- `bg-white rounded-2xl p-8 border border-fog`
- Decorative `"` mark: `font-heading font-extrabold text-6xl text-violet opacity-20 leading-none mb-2`
- Quote: `font-body text-base text-graphite leading-[1.7]`
- Divider: `mt-6 pt-6 border-t border-fog`
- Name: `font-body font-bold text-base text-midnight`
- Role: `font-body text-sm text-lp-zinc`

**4 testimonials** with provided copy (Rajesh Menon, Priya Sharma, Karthik Sundaram, Deepak Yadav).

**Card 4 special:** Below the card (outside it), an italic translation note: `font-body text-sm text-lp-zinc italic mt-3 px-2`

**Data:** Array of objects with `quote`, `name`, `role`, and optional `translationNote` field (only card 4).

**Imports:** `AnimateIn` from `../AnimateIn`

No other files changed.

