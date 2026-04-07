

# Landing Page Audit & Fix Plan

## Issues Found

### 1. Logo doesn't navigate home
**Navbar.tsx line 38**: Logo uses `<a href="#">` — this only scrolls to page top on the landing page. On sub-pages (About Us, Contact, Privacy Policy, Terms, Refund Policy), clicking the logo does nothing useful.
**Fix**: Change to `<Link to="/">` so it always navigates to the home page.

### 2. Footer logo doesn't link home
**Footer.tsx line 88**: The "Ledge" wordmark in the footer bottom bar is plain text with no link.
**Fix**: Wrap in `<Link to="/">`.

### 3. Footer "Features" and "Pricing" links are broken on sub-pages
**Footer.tsx lines 71-76**: "Features" and "Pricing" use `<a href="#">` — they should link to `/#features` and `/#pricing` so they work from any page.
**Fix**: Map these to `<Link to="/#features">` and `<Link to="/#pricing">` (or use `<a href="/#features">`).

### 4. Navbar anchor links broken on sub-pages
**Navbar.tsx lines 44-51**: The nav links (`#features`, `#how-it-works`, `#pricing`) use `<a href="#...">` — these only work on the landing page. On sub-pages they do nothing.
**Fix**: Change to full paths (`/#features`, `/#how-it-works`, `/#pricing`).

### 5. Same issue in mobile nav
**Navbar.tsx lines 77-85**: Mobile sheet links have the same `href="#..."` problem.
**Fix**: Same as above.

### 6. Console warning: FinalCTA ref issue
FinalCTA and Footer are getting refs passed to them (likely from framer-motion or parent). They are plain function components that don't accept refs.
**Fix**: This is cosmetic (no user-facing bug), but can be resolved by not passing refs or wrapping with `forwardRef` if needed. Low priority — note only.

### 7. AboutUs "Get in Touch" button uses old color token
**AboutUs.tsx line 148**: Button uses `bg-ink` which was the old black color, now mapped to indigo via CSS. Should verify it renders correctly with the new palette, or update to `bg-indigo-600` for consistency.

## Files to Change

| File | Changes |
|------|---------|
| `src/components/landing/sections/Navbar.tsx` | Logo → `<Link to="/">`; nav links → `/#features` etc. |
| `src/components/landing/sections/Footer.tsx` | Logo → `<Link to="/">`; Features/Pricing links → proper routes; simplify link rendering with a map |
| `src/pages/AboutUs.tsx` | Update CTA button class from `bg-ink` to `bg-indigo-600` for consistency |

## What Stays the Same
- All page content and copy
- All styling and visual design
- All routing in App.tsx (already correct)
- Section `id` attributes (already correct: `features`, `how-it-works`, `pricing`)

