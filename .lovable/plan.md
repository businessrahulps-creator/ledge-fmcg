

# Build Problem Section

Replace `src/components/landing/sections/Problem.tsx` with the full two-column pain-point layout.

## File: `src/components/landing/sections/Problem.tsx`

**Structure:**
- `bg-cream py-16 md:py-32`
- Inner: `max-w-7xl mx-auto px-6`
- Grid: `grid grid-cols-1 lg:grid-cols-12 gap-16`

**Left column (`lg:col-span-4 lg:sticky lg:top-32 self-start`):**
- `"You know this routine."` — `font-heading font-bold text-[28px] md:text-[44px] text-midnight leading-[1.08] tracking-[-0.03em]`

**Right column (`lg:col-span-8`):**
- 4 cards in `space-y-6`, each wrapped in `AnimateIn` with staggered delay (0, 0.08, 0.16, 0.24s)
- Each card: `bg-white rounded-2xl p-8 border border-fog`
  - Lucide icon (24px, `text-violet`, `mb-4`): MessageCircle, Table, Compass, Laptop
  - Title: `font-heading font-bold text-[20px] text-midnight mb-3`
  - Description: `font-body text-base text-graphite leading-[1.7]`
- Closing line below cards: `mt-8`, `font-body font-medium text-lg text-violet`, centered on mobile, left-aligned on desktop

**Imports:** `MessageCircle`, `Table`, `Compass`, `Laptop` from lucide-react; `AnimateIn` from `../AnimateIn`

**No other files changed.**

