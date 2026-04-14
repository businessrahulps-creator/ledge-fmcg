

# Fix Login & Signup Button Color Mismatch

## Problem
The landing page CTAs use `bg-[#27272A]` (dark charcoal), but the Login and Signup pages use the default `<Button>` component which renders with `bg-primary` (teal `hsl(160, 45%, 40%)`). This creates a jarring color disconnect when navigating from the landing page to auth pages.

## Fix — 2 files

### 1. `src/pages/Login.tsx`
Override the "Sign in" button to match the landing page style:
- Add `className="w-full bg-[#27272A] hover:bg-[#1A1A1A] text-white rounded-full"` to the submit Button

### 2. `src/pages/Signup.tsx`
Override the "Start free trial" button similarly:
- Add `className="w-full bg-[#27272A] hover:bg-[#1A1A1A] text-white rounded-full"` to the submit Button

Two lines changed, one per file. Everything else stays the same.

