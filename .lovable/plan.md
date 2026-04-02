

# Apple Liquid Glass Bottom Nav

## Concept
Apply iOS 26's "Liquid Glass" aesthetic to the mobile bottom nav — a translucent frosted glass bar with vibrant blur, subtle light refraction borders, and a smooth glowing active indicator that morphs between tabs.

## Visual changes

**Bar itself:**
- Replace solid `bg-card border` with frosted glass: `bg-white/60 dark:bg-black/40` + `backdrop-blur-2xl backdrop-saturate-[1.8]`
- Subtle top-edge highlight: `border-t border-white/30 dark:border-white/10` (light refraction effect)
- Softer, more diffused shadow: `shadow-[0_-4px_30px_rgba(0,0,0,0.08)]`
- Slightly more rounded: keep `rounded-2xl`

**Active pill indicator:**
- Change from flat `bg-muted` to a glowing translucent pill: `bg-foreground/10 dark:bg-white/15` with a subtle `shadow-[0_0_12px_rgba(0,0,0,0.06)]`
- Add `backdrop-blur-md` to the pill itself for a nested glass-in-glass effect
- Smoother spring: lower stiffness (~350), higher damping (~35)

**Icons & labels:**
- Active icon: slightly larger scale via `scale-105` transition
- Active label: `font-bold` instead of `font-semibold`, slight opacity bump
- Inactive: lower opacity (`text-muted-foreground/70`) for more contrast with active

**Fade hint:**
- Change from solid `from-card` to `from-white/60 dark:from-black/40` to match the translucent bar

## File: `src/components/layout/AppLayout.tsx`
- Update `<nav>` className for glass effect
- Update `motion.div` pill styling
- Update icon/label active/inactive classes
- Update fade gradient colors

## Result
Same layout and swipe behavior, but the bar now looks like it's floating on frosted glass — consistent with Apple's Liquid Glass language while blending with the existing monochrome design system.

