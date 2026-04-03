

# Reduce Hero CTA Button Size

## Change

**File: `src/components/landing/sections/Hero.tsx`** (lines 164-177)

Make both hero buttons match the navbar CTA sizing (`px-6 py-2.5 text-sm`) instead of the current oversized `px-8 py-3.5` with no explicit text size:

- Primary CTA: `px-8 py-3.5` → `px-6 py-2.5 text-sm`
- Secondary CTA: `px-8 py-3.5` → `px-6 py-2.5 text-sm`

This aligns the hero buttons with the navbar button styling for a cohesive, refined look. One file, two class changes.

