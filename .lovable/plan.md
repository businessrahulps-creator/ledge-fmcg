

# Fix Hero CTA Buttons for Mobile — Premium, Polished Layout

## Problem
On mobile (390px), the two hero buttons are side-by-side with mismatched sizes — "Get Started Free" uses `text-xs` with heavy padding while "See How It Works" uses `text-sm` with different padding and border-radius. They look unfinished and inconsistent.

## Fix — `src/components/landing/sections/Hero.tsx`

Stack buttons vertically on mobile, make them full-width and identical in size:

- **Layout**: Change `flex-wrap gap-4` → `flex flex-col sm:flex-row gap-3 sm:gap-4` so buttons stack on mobile, go side-by-side on larger screens
- **"Get Started Free"**: `text-xs px-8 py-3.5 rounded-2xl` → `w-full sm:w-auto text-base px-8 py-4 rounded-full text-center justify-center`
- **"See How It Works"**: `text-sm px-7 py-3 rounded-3xl` → `w-full sm:w-auto text-base px-8 py-4 rounded-full text-center justify-center font-semibold`
- Both buttons get identical `py-4 text-base font-semibold rounded-full` for a premium, consistent look matching the screenshot reference

## What does NOT change
- Desktop layout (buttons go side-by-side via `sm:flex-row`)
- Colors, shadows, hover effects
- Rest of the Hero section

