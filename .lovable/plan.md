

# Selective Visual Refresh — Soft Purple Gradient Aesthetic

## What Changes

A targeted reskin of the landing page to adopt the soft lavender/purple gradient aesthetic from the screenshot you shared, while keeping the existing content, structure, and component architecture intact.

## Design Direction

**Current:** High-contrast monochrome — `bg-white`, `bg-cream`, `bg-[#FAFAFA]`, black `bg-ink` buttons, flat `border-fog` cards.

**New:** Soft purple gradient warmth — gentle lavender washes as section backgrounds, subtle purple-tinted gradients on the hero, frosted glass-like cards with light purple borders, and indigo-purple accent buttons instead of pure black.

## Color Palette Shift

| Token | Current | New |
|-------|---------|-----|
| Hero BG | `bg-white` | Soft radial gradient: white center → lavender-50 edges |
| Section alternation | `bg-white` / `bg-cream` / `bg-[#FAFAFA]` | `bg-white` / `bg-violet-50/30` / `bg-indigo-50/20` |
| Primary CTA button | `bg-ink` (black) | `bg-indigo-600` with hover `bg-indigo-700` |
| Secondary CTA | `border-fog text-midnight` | `border-indigo-200 text-indigo-700` |
| Card borders | `border-fog` (gray) | `border-indigo-100` or `border-purple-100` |
| Icon accent color | `text-accent-indigo` (#4F46E5) | Keep as-is — already fits |
| Step badges | `bg-accent-wash text-accent-indigo` | `bg-purple-100 text-purple-700` |
| Highlighted pricing card | `border-2 border-ink` | `border-2 border-indigo-500` with faint purple glow |
| "Most Popular" badge | `bg-ink text-white` | `bg-indigo-600 text-white` |
| Final CTA section | `bg-[#FAFAFA]` | Soft gradient: `bg-gradient-to-b from-indigo-50 to-white` |

## Files to Change

| File | What |
|------|------|
| `src/index.css` | Add new CSS custom properties for the purple palette; update `--accent` to indigo-600 |
| `src/components/landing/sections/Hero.tsx` | Hero background → soft radial gradient; CTA buttons → indigo; dashboard mockup chrome tint |
| `src/components/landing/sections/TrustBar.tsx` | Section bg → `bg-indigo-50/30` |
| `src/components/landing/sections/Problem.tsx` | Section bg → `bg-violet-50/30`; card borders → `border-indigo-100` |
| `src/components/landing/sections/HowItWorks.tsx` | Step badges → purple tint; mockup borders soften to `border-indigo-100` |
| `src/components/landing/sections/Features.tsx` | Section bg → `bg-violet-50/20`; card borders → `border-indigo-100`; hover border → indigo-200 |
| `src/components/landing/sections/WhyOrdra.tsx` | Left border accent → `border-indigo-500`; section bg → `bg-white` |
| `src/components/landing/sections/Testimonials.tsx` | Section bg → `bg-indigo-50/20`; quote mark → indigo tint |
| `src/components/landing/sections/Pricing.tsx` | Highlighted card → indigo border + subtle glow; CTA buttons → indigo |
| `src/components/landing/sections/FinalCTA.tsx` | Gradient background; CTA button → indigo |
| `src/components/landing/sections/Navbar.tsx` | CTA button → indigo; scrolled bg keeps white/blur |
| `src/components/landing/sections/Footer.tsx` | Subtle `bg-indigo-50/10` tint; border → indigo-100 |

## What Stays the Same

- All content and copy
- Typography system (Plus Jakarta Sans headings, Inter body)
- Component architecture and animation system
- Page structure and section ordering
- Dashboard/phone mockups (structure unchanged, just border color tweaks)
- Mobile responsiveness
- All routing and navigation

## Visual Result

The page will feel lighter, warmer, and more modern — shifting from a stark monochrome SaaS look to a softer, approachable purple-gradient aesthetic that matches the screenshot you liked, while keeping Ledge's professional Indian-market positioning intact.

