# Remove Enterprise tier, keep 3 plans with breathing space

## Changes in `src/components/landing/sections/Pricing.tsx`

1. **Drop the Enterprise plan** from the `plans` array (Free, Growth, Scale only).
2. **Grid**: change `lg:grid-cols-4` → `lg:grid-cols-3`. Tighten `max-w-6xl` → `max-w-5xl` on the grid so 3 cards breathe without stretching too wide.
3. **Remove tint logic for index 3** (`tintBone`). Keep Scale (i === 2) on Midnight tint, Growth highlighted, Free default.
4. **Remove unused `Building2` import.**
5. **Rewrite the WhatsApp helper line** below the grid to subtly surface enterprise needs. New copy:

   > Need something custom — Tally/SAP, on-prem, multi-brand? Chat on WhatsApp →

   Same link, same styling, same single-line treatment. Pre-fill the wa.me `text` query with: `Hi, I'd like to discuss a custom Ledge plan for my business.`

## Memory

Update `mem://auth/pricing-tiers` from four-tier to three-tier (Free, Growth, Scale); note Enterprise is handled via WhatsApp conversation rather than a public card.

## Out of scope

- No copy changes to Free/Growth/Scale features, prices, or CTAs.
- No layout changes elsewhere on the page (eyebrow, trust chip, headline untouched).
- No new sections or modals.

## Verification

- Pricing renders 3 cards on desktop with comfortable gaps (centered, not stretched).
- Mobile keeps single column; `md` keeps 2-up.
- WhatsApp link opens with the new prefilled message.
