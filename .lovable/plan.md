

# Build Features Section

Replace `src/components/landing/sections/Features.tsx` with a 3×2 feature card grid on a dark background.

## File: `src/components/landing/sections/Features.tsx`

**Section wrapper:** `bg-midnight py-16 md:py-32`

**Headline:** `font-heading font-bold text-[28px] md:text-[44px] text-white text-center mb-4 tracking-[-0.03em]` — "Everything you need. Nothing you don't."

**Subheadline:** `font-body text-lg text-silver text-center mb-16` — "Built from the ground up for Indian FMCG distribution."

**Grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto`

**Each card:**
- `bg-onyx border border-slate-border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3F3F46]`
- Wrapped in `AnimateIn` with staggered delay (i * 0.08)
- Icon: Lucide, 24px, `text-violet mb-5`
- Title: `font-heading font-bold text-[20px] text-white mb-3`
- Description: `font-body text-base text-silver leading-[1.65]`

**6 cards:** LayoutGrid, ClipboardCheck, Users, Package, IndianRupee, CloudOff — with provided copy.

**Imports:** `AnimateIn` from `../AnimateIn`, 6 Lucide icons.

No other files changed.

