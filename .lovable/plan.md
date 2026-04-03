

# Remove Trust Chips from Hero

## Change

**File: `src/components/landing/sections/Hero.tsx`**

- Delete the `trustChips` array (lines 10-14)
- Delete the entire trust chips rendering block (lines 191-200): the `motion.div` containing the mapped `<span>` elements

No other files affected. No layout shifts since the chips sit below the CTA buttons and removing them just tightens the spacing naturally.

