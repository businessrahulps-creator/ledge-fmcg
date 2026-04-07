

# Fix Landing Page Navigation Links

## Problem
The navbar has three links — Features (`#features`), Pricing (`#pricing`), About (`#about`) — but **none of the landing page sections have `id` attributes**, so clicking them does nothing. Also, "About" doesn't map to any section on the page.

## Fix

### 1. Update nav links to match actual sections
Replace the links array in `src/components/landing/sections/Navbar.tsx`:

| Current | New |
|---------|-----|
| Features → `#features` | Features → `#features` |
| Pricing → `#pricing` | Pricing → `#pricing` |
| About → `#about` | How It Works → `#how-it-works` |

"About" has no corresponding section. Replace it with "How It Works" which is a real section users would want to jump to. Alternatively, we could add a "Log in" link here.

### 2. Add `id` attributes to landing sections
Add anchor IDs to the wrapper elements in these files:

- `src/components/landing/sections/Features.tsx` → `id="features"`
- `src/components/landing/sections/Pricing.tsx` → `id="pricing"`
- `src/components/landing/sections/HowItWorks.tsx` → `id="how-it-works"`

### 3. Add smooth scrolling
Add `scroll-behavior: smooth` to the landing page wrapper in `src/pages/Index.tsx` so clicking nav links produces a smooth scroll instead of a jarring jump.

## Files to Change
| File | Change |
|------|--------|
| `src/components/landing/sections/Navbar.tsx` | Update links array (replace "About" with "How It Works") |
| `src/components/landing/sections/Features.tsx` | Add `id="features"` to section wrapper |
| `src/components/landing/sections/Pricing.tsx` | Add `id="pricing"` to section wrapper |
| `src/components/landing/sections/HowItWorks.tsx` | Add `id="how-it-works"` to section wrapper |
| `src/pages/Index.tsx` | Add `scroll-smooth` class to root div |

