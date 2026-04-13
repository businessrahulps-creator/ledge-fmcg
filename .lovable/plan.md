

# Add Sign In Button to Navbar

Add a "Sign in" link next to the "Get Started Free" CTA on both desktop and mobile.

## Changes — `src/components/landing/sections/Navbar.tsx`

### Desktop (line ~56)
- Change the `hidden md:block` div to `hidden md:flex items-center gap-4`
- Add a `<Link to="/login">` styled as a calm text link (`text-[15px] text-[#52525B] hover:text-[#1A1A1A]`) before the existing "Get Started Free" button

### Mobile sheet (line ~90)
- Add a `<Link to="/login">` styled as a secondary text link before the "Get Started Free" button at the bottom of the sheet

## What does NOT change
- All existing nav links, CTA button styling, logo, scroll behavior, mobile sheet structure
- No text changes to existing elements

