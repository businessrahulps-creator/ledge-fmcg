

# Center Hero Content Vertically

## Problem
The hero section uses `pt-36 py-20 md:py-32` which pushes content toward the top. With `min-h-screen`, the content isn't vertically centered.

## Fix

**File: `src/components/landing/sections/Hero.tsx`** (line 144)

Replace the fixed padding approach with flexbox centering:

```
// Before
<section className="min-h-screen bg-white pt-36 py-20 md:py-32 px-6">

// After
<section className="min-h-screen bg-white flex items-center pt-16 px-6">
```

This uses `flex items-center` to truly vertically center the content within the full viewport height, with a small `pt-16` to account for the fixed navbar. One line change.

