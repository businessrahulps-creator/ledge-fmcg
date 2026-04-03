

# Build How It Works Section

Replace `src/components/landing/sections/HowItWorks.tsx` with a three-row alternating layout.

## File: `src/components/landing/sections/HowItWorks.tsx`

**Section wrapper:** `bg-white py-16 md:py-32`

**Headline:** Centered, `font-heading font-bold text-[28px] md:text-[44px] text-midnight mb-16 tracking-[-0.03em]` — "Three steps. Sixty seconds. Total clarity."

**Data:** Array of 3 step objects, each with: badge label, title, description, placeholder text, and a boolean `reversed` flag (rows 1 & 3 = text-left/image-right, row 2 = image-left/text-right).

**Each row** (spaced with `space-y-24`):
- `grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`
- On reversed rows, use `lg:order-1` / `lg:order-2` to swap column positions
- Wrapped in `AnimateIn` with staggered delay per row

**Text column:**
- Step badge: `bg-violet-wash text-violet text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4`
- Title: `font-heading font-bold text-[24px] md:text-[28px] text-midnight`
- Description: `font-body text-[17px] text-graphite leading-[1.7] mt-4`

**Image column:**
- `bg-snow rounded-2xl aspect-video border border-fog flex items-center justify-center`
- Placeholder text: `font-body text-sm text-silver`

**Imports:** `AnimateIn` from `../AnimateIn`

**Content:**
1. "Your salesperson places the order." / Order Creation Screenshot
2. "You see everything, instantly." / Dashboard KPI Screenshot (reversed)
3. "You spot what matters before it becomes a problem." / Stock Health Screenshot

No other files changed.

