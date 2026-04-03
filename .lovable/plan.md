

# Build Final CTA Section

Replace `src/components/landing/sections/FinalCTA.tsx` with the full dark CTA block.

## File: `src/components/landing/sections/FinalCTA.tsx`

**Section wrapper:** `bg-midnight py-20 md:py-32`

**Inner container:** `max-w-7xl mx-auto px-6 text-center`

**Headline** (wrapped in `AnimateIn`):
- `font-heading font-extrabold text-[28px] md:text-[48px] text-white max-w-3xl mx-auto leading-[1.1]`
- "Right now, your salesperson is placing an order somewhere. Can you see it?"

**Subheadline:** `font-body text-[20px] text-silver max-w-xl mx-auto mt-6`
- "Set up Ordra in 15 minutes. Your team starts placing orders today."

**CTA buttons** (`flex justify-center gap-4 mt-10 flex-wrap`):
- Primary: `Link to="/signup"`, `bg-violet text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-violet-hover hover:scale-[1.02] transition-all duration-200 inline-flex items-center`
- Secondary: `a href="mailto:hello@ordra.in"`, `text-white border border-white/25 px-8 py-4 rounded-full hover:border-white/50 transition-all duration-200 inline-flex items-center`

**Trust badges** (`flex justify-center gap-4 md:gap-6 flex-wrap mt-10`):
- Each: `bg-onyx text-silver text-sm px-4 py-2 rounded-full flex items-center gap-2`
- 4 pills: "🔒 Bank-grade encryption", "📱 Any phone", "🇮🇳 Data in India", "⚡ Live today"

**Imports:** `AnimateIn` from `../AnimateIn`, `Link` from `react-router-dom`

No other files changed.

