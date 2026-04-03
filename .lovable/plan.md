

# Build Hero Section

Replace the placeholder `Hero.tsx` with a fully styled, two-column hero section.

## File: `src/components/landing/sections/Hero.tsx`

**Structure:**
- `min-h-screen`, `bg-midnight`, `py-20 md:py-32`, `pt-36` (accounts for fixed navbar)
- Inner container: `max-w-7xl mx-auto px-6`
- Grid: `grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`

**Left column — Text content (uses Framer Motion for stagger):**
- Headline split into two lines, each wrapped in a motion.div with `fadeUp` + 100ms stagger delay
- `font-heading font-extrabold text-[34px] md:text-[60px] text-white leading-[1.08] tracking-[-0.03em]`
- Subheadline: `font-body text-[17px] md:text-[20px] text-silver leading-[1.6] max-w-xl mt-6`
- CTA row: `flex flex-wrap gap-4 mt-8`
  - Primary: violet pill with hover scale
  - Secondary: transparent bordered pill
- Trust chips row: `flex flex-wrap gap-3 mt-8`, three onyx pill badges

**Right column — Mockup frame:**
- Container with `aspect-[9/16] md:aspect-[3/4]`, `max-w-md mx-auto`, `bg-onyx rounded-3xl`
- Border: `border border-[rgba(124,58,237,0.15)]`
- Glow shadow via inline style: `boxShadow: "0 0 80px rgba(124, 58, 237, 0.12)"`
- 3D tilt on desktop via `lg:transform lg:perspective-[1200px] lg:rotate-y-[-4deg]` (inline style for rotateY since Tailwind doesn't support it natively)
- Framer Motion: slides in from `x: 60, opacity: 0` → `x: 0, opacity: 1`, 800ms ease-out
- Centered placeholder text in silver

**Animation approach:** Use `motion.div` from framer-motion directly (already a dependency) with `initial`/`animate` for page-load animations. No scroll trigger needed for hero — it animates on mount.

**No other files changed.**

