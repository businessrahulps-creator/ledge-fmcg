

# Rebrand: Ordra → Ledge (Site-Wide)

## Overview
Replace every instance of "Ordra" with "Ledge" across all 20 files, remove the circle/square icon from all navigation components, and redesign the text logo to look elegant and premium.

## Logo Design Approach
Remove the colored circle/square icon entirely. Replace with a pure typographic wordmark: **"Ledge"** styled with tight letter-spacing, a premium weight (font-bold or font-extrabold), and the existing heading font. Clean, minimal, no icon. Think Linear or Stripe-level simplicity.

## Files to Edit

### Navigation & Layout (remove icon + rename)
1. **`src/components/landing/sections/Navbar.tsx`** (line 38-42): Remove the `<div>` circle icon, replace "Ordra" with styled "Ledge" wordmark
2. **`src/components/landing/LandingNav.tsx`** (line 29-31): Remove blue square icon, replace "Ordra" with "Ledge"
3. **`src/components/layout/AppSidebar.tsx`** (line 61-67): Remove the rounded-lg icon div, replace "Ordra" with "Ledge". For collapsed state, show just "L" as a minimal square mark
4. **`src/components/layout/AppLayout.tsx`** (line 42-47): Remove mobile header icon div, replace "Ordra" with "Ledge"
5. **`src/components/landing/LandingFooter.tsx`** (line 32-34): Remove icon div, replace "Ordra" with "Ledge"
6. **`src/components/landing/sections/Footer.tsx`** (line 56-58): Replace "Ordra" text and copyright

### Landing Page Copy (text replacement only)
7. **`src/components/landing/sections/Hero.tsx`**: All "Ordra" references
8. **`src/components/landing/sections/TrustBar.tsx`**: "opened Ordra" → "opened Ledge"
9. **`src/components/landing/sections/Testimonials.tsx`**: "the Ordra link" → "the Ledge link"
10. **`src/components/landing/sections/FinalCTA.tsx`**: "Set up Ordra" → "Set up Ledge"
11. **`src/components/landing/sections/HowItWorks.tsx`**: Any "Ordra" mentions
12. **`src/components/landing/sections/Features.tsx`**: Any "Ordra" mentions
13. **`src/components/landing/sections/WhyOrdra.tsx`**: Rename if file contains visible "Ordra" text
14. **`src/components/landing/SocialProofBar.tsx`**: "Ordra is helping" → "Ledge is helping"

### App Pages
15. **`src/pages/Login.tsx`**: "Ordra workspace" → "Ledge workspace"
16. **`src/pages/Signup.tsx`**: Any "Ordra" references
17. **`src/components/InstallPrompt.tsx`**: "Install Ordra" → "Install Ledge", storage key "ordra-install-state" → "ledge-install-state"

### Config & Meta
18. **`index.html`**: All meta tags, title, og:title, twitter:title
19. **`vite.config.ts`**: PWA manifest name/short_name
20. **`public/robots.txt`**: If "Ordra" appears

### Logo Styling (all nav locations)
The wordmark will use:
```
font-heading font-extrabold text-xl tracking-[-0.04em]
```
No icon. Just the word "Ledge" as a clean, tight typographic mark. For the collapsed sidebar, a minimal "L" in the same style replaces the old square icon.

## Summary
- ~155 occurrences of "Ordra" replaced with "Ledge" across ~20 files
- Circle/square icon removed from 5 navigation components
- Text-only wordmark with premium typography applied everywhere

