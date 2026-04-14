

# Unify All Landing Page Buttons to Dark Charcoal

## What's changing
Every button/CTA across the landing page switches from teal (`#0D9488`) to a dark charcoal (`#27272A` / hover `#1A1A1A`) matching the second reference image. Button sizing is standardized to `px-8 py-3.5 rounded-2xl text-base` everywhere, including mobile nav.

## Files to edit

### 1. `src/components/landing/sections/Navbar.tsx`
- **Desktop CTA** (line ~62): `bg-[#0D9488]` → `bg-[#27272A]`, hover → `hover:bg-[#1A1A1A]`, shadow rgba updated to neutral black, size → `px-8 py-3 rounded-2xl text-base`
- **Mobile CTA** (line ~104): Same color + size swap, `rounded-2xl`

### 2. `src/components/landing/sections/Hero.tsx`
- **Hero CTA** (line ~43): `bg-[#0D9488]` → `bg-[#27272A]`, hover → `hover:bg-[#1A1A1A]`, shadow rgba neutral, size → `px-8 py-3.5 rounded-2xl text-base`

### 3. `src/components/landing/sections/FinalCTA.tsx`
- **Final CTA** (line ~22): Same color swap, shadow neutral, size → `px-10 py-4 rounded-2xl text-base`

### 4. `src/components/landing/sections/Pricing.tsx`
- **Highlighted plan CTA style** (line ~44): `bg-[#0D9488]` → `bg-[#27272A]`, hover → `hover:bg-[#1A1A1A]`
- **Highlighted plan border** (line ~108): `border-[#0D9488]` → `border-[#27272A]`
- **"Most Popular" badge** (line ~118): `bg-[#0D9488]` → `bg-[#27272A]`
- **Plan icon color** (line ~123): stays teal (accent, not a button)
- **Check icon color** (line ~158): stays teal (accent, not a button)
- **"Chat on WhatsApp"** (line ~187): stays teal (text link, not a button)
- **CTA box-shadow** (line ~172): neutral black shadows
- **CTA sizing** (line ~169): standardized `py-3.5 rounded-2xl text-base`

## What does NOT change
- All copy/text verbatim
- Section structure, order, layout, animations
- Teal accent on icons, checkmarks, and text links (only buttons change)
- Sign in text link styling
- Typography, spacing between sections

