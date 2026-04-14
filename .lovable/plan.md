

# Premium Mobile Navigation Redesign

## What changes

Redesign the mobile Sheet menu in `Navbar.tsx` to match the Perplexity-style left-side drawer: full-height, clean icon-based navigation links, spacious layout, and two equal-width CTA buttons pinned at the bottom.

## Design

```text
┌─────────────────────────────┐
│  Menu                    ✕  │
│                             │
│  🏠  Home                   │
│  ⚡  Features               │
│  🔄  How It Works           │
│  💰  Pricing                │
│                             │
│                             │
│         (spacer)            │
│                             │
│  ┌─────────────────────┐    │
│  │    Sign Up           │    │  ← dark bg, white text
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │    Log in            │    │  ← light bg, dark text, same size
│  └─────────────────────┘    │
└─────────────────────────────┘
```

## Changes to `src/components/landing/sections/Navbar.tsx`

- **Sheet side**: Change from `side="right"` to `side="left"` to match Perplexity
- **Add "Home" link**: New first item linking to `/#` or top of page
- **Add icons**: Use Lucide icons (Home, Sparkles, RefreshCw, CreditCard) next to each nav link for premium feel
- **Link styling**: Larger text (~`text-[17px]`), `text-[#52525B]`, generous vertical spacing (`gap-5`), icon + label layout
- **Bottom CTAs**: Two full-width buttons of equal size stacked at the bottom:
  - "Sign Up" — `bg-[#27272A] text-white rounded-2xl py-3.5 text-base font-semibold`
  - "Log in" — `bg-[#F4F4F5] text-[#1A1A1A] rounded-2xl py-3.5 text-base font-semibold`
- **Sheet width**: Increase to `w-80` for more breathing room
- **Close button**: Keep the built-in Sheet X button, style it as a circle like Perplexity (`rounded-full border`)

## Files modified (1)
- `src/components/landing/sections/Navbar.tsx`

