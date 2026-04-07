

# Fix Testimonial Cards Equal Height

## Problem
The 4th testimonial card appears larger because it has a shorter quote, causing the `h-full` class to not equalize heights across grid rows. The 2x2 grid only equalizes within each row — the second row's cards stretch differently than the first row's.

## Fix

**File: `src/components/landing/sections/Testimonials.tsx`**

Add `flex` to the outer wrapper div so `h-full` on the inner card works correctly within the grid, and add `min-h` or use CSS grid's implicit equal-row behavior by ensuring the grid items stretch uniformly:

- Change the outer `<div>` wrapper to include `className="h-full"` 
- Add `flex flex-col` to the card so content flows evenly
- Add `flex-1` to the quote paragraph so all cards stretch to the same height regardless of quote length

This ensures all 4 cards in the 2x2 grid render at equal height.

## Files to Change
| File | Change |
|------|--------|
| `src/components/landing/sections/Testimonials.tsx` | Add `h-full` to wrapper div, `flex flex-col` to card, `flex-1` to quote |

