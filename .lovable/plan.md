

# Fix Navbar Logo Alignment with Hero Content

## Problem
The Navbar container uses `max-w-[1200px]` while the Hero section uses `max-w-7xl` (1280px). This 80px difference causes the "Ledge" logo to sit ~40px to the right of where the headline text starts.

## Fix

**File: `src/components/landing/sections/Navbar.tsx`** (line 36)

Change the inner container's max-width from `max-w-[1200px]` to `max-w-7xl` so it matches the Hero section's container width. Both will then share the same left edge with `px-6` padding.

```
// Before
<div className="max-w-[1200px] mx-auto w-full px-6 ...">

// After
<div className="max-w-7xl mx-auto w-full px-6 ...">
```

One line change, one file.

