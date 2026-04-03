

# Build Trust Bar Section

Replace `src/components/landing/sections/TrustBar.tsx` with three stacked elements: logo marquee, stat row with count-up, and pull quote card.

## File: `src/components/landing/sections/TrustBar.tsx`

**Section wrapper:** `bg-[#FAFAFA] py-20`

### 1. Logo Marquee
- Container with `overflow-hidden opacity-60`
- Inner flex row of 12 placeholder boxes (6 duplicated for seamless loop), each `w-24 h-8 bg-fog rounded-lg shrink-0`
- CSS `@keyframes marquee` for infinite horizontal scroll (30s linear), applied via inline style or Tailwind arbitrary animation
- Add the keyframe to `tailwind.config.ts` under `keyframes.marquee` → `{ "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } }` and `animation.marquee: "marquee 30s linear infinite"`

### 2. Stat Row (mt-12)
- `grid grid-cols-3 max-w-3xl mx-auto text-center`
- Three stats using `useCountUp` + `useInView` from existing `AnimateIn.tsx`:
  - `₹10Cr+` (value=10, prefix="₹", suffix="Cr+") / "Monthly orders managed"
  - `12` (value=12) / "States covered"
  - `50+` (value=50, suffix="+") / "FMCG brands onboarded"
- Number: `font-heading font-extrabold text-[36px] md:text-[48px] text-midnight`
- Label: `font-body text-sm text-lp-zinc`
- Each stat wrapped in `AnimateIn` with staggered delay

### 3. Pull Quote (mt-12)
- Card: `bg-cream rounded-2xl p-8 max-w-2xl mx-auto relative`
- Decorative `"` top-left: `absolute top-4 left-6 text-6xl font-serif text-violet opacity-30 leading-none`
- Quote text: `font-body text-lg text-graphite italic leading-[1.7] pl-8`
- Attribution: `font-body font-semibold text-midnight mt-4 pl-8`
- Wrapped in `AnimateIn`

### Tailwind config change
Add `marquee` keyframe and animation to `tailwind.config.ts`.

## Files Changed
| File | Action |
|---|---|
| `src/components/landing/sections/TrustBar.tsx` | Full rewrite |
| `tailwind.config.ts` | Add marquee keyframe + animation |

