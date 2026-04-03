

# Build Why Ordra Section

Replace `src/components/landing/sections/WhyOrdra.tsx` with four bordered content blocks.

## File: `src/components/landing/sections/WhyOrdra.tsx`

**Section wrapper:** `bg-snow py-16 md:py-32`

**Headline:** `font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]` — "This isn't another ERP you'll abandon in a month."

**Container:** `max-w-3xl mx-auto space-y-12`

**Each block** (4 total, wrapped in `AnimateIn` with staggered delay `i * 0.1`):
- `border-l-4 border-violet pl-8`
- Subtitle: `font-heading font-bold text-[24px] text-midnight mb-4`
- Paragraph: `font-body text-[17px] text-graphite leading-[1.7]`

**4 blocks:**
1. "Your team will actually open it." + provided copy
2. "Installs in 30 seconds. No IT department." + provided copy
3. "Built here. For here." + provided copy
4. "See everything. Chase nothing." + provided copy

**Imports:** `AnimateIn` from `../AnimateIn`

No other files changed.

