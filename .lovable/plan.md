

# Build Pricing Section

Replace `src/components/landing/sections/Pricing.tsx` with a 4-card pricing grid.

## File: `src/components/landing/sections/Pricing.tsx`

**Section wrapper:** `bg-white py-16 md:py-32`

**Headline:** `font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-2 tracking-[-0.03em]` — "Simple pricing. Start free. Grow when ready."

**Subheadline:** `font-body text-lg text-lp-zinc text-center mb-16` — "No setup fees. No annual lock-in. Cancel anytime."

**Grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto`

**Each card** (wrapped in `AnimateIn`, delay `i * 0.08`):
- Default: `bg-white rounded-2xl p-8 border border-fog flex flex-col`
- Highlighted (Growth): `border-2 border-violet relative` + "Most Popular" badge: `absolute -top-3 left-1/2 -translate-x-1/2 bg-violet text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap`

**Card content:**
- Plan name: `font-heading font-bold text-[20px] text-midnight`
- Price: `font-heading font-extrabold text-[36px] text-midnight` with `₹` and `/month` in `text-lp-zinc text-base font-normal`
- Feature list: `mt-6 space-y-3 flex-1`, each item: `flex items-start gap-2` with `Check` icon (16px, `text-lp-emerald shrink-0 mt-0.5`) + `font-body text-[15px] text-graphite`
- CTA: `mt-8 w-full py-3 rounded-full text-center font-semibold text-sm transition-all duration-200` with variant styling per card

**4 plans:** Free, Growth (highlighted), Scale, Enterprise — with provided features and CTA styles.

**Footer text (below grid):**
- `text-center mt-10 space-y-2`
- Line 1: `font-body text-[15px] text-lp-zinc`
- Line 2: `font-body text-[15px] text-violet font-medium hover:underline cursor-pointer`

**Imports:** `Check` from lucide-react, `AnimateIn` from `../AnimateIn`, `Link` from react-router-dom

**Data:** Array of plan objects with `name`, `price`, `priceLabel`, `period`, `features`, `cta`, `highlighted`, `ctaStyle` fields.

No other files changed.

