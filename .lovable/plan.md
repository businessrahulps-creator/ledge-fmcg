

# Remove All Em Dashes from Landing Page

## Scope
134 occurrences of `—` across 9 files in `src/components/landing/sections/`. Each em dash will be replaced with a simple hyphen surrounded by spaces (` - `) to preserve readability without changing meaning.

## Files to edit

| File | Approx. count |
|------|--------------|
| `Features.tsx` | ~10 |
| `Pricing.tsx` | ~4 |
| `Testimonials.tsx` | ~4 |
| `TrustBar.tsx` | ~2 |
| `WhyOrdra.tsx` | ~6 |
| `HowItWorks.tsx` | ~6 |
| `Hero.tsx` | ~2 (1 content + 1 comment) |
| `Problem.tsx` | ~4 |
| `FinalCTA.tsx` | ~1 |

## Replacement rule
- `—` → ` - ` (hyphen with spaces on both sides)
- Where `—` already has a space before it, avoid double spaces
- HTML comments (`{/* Left — Text */}`) will also be cleaned

## What does NOT change
- All component structure, layout, animations, styling
- Arrow characters (`→`) remain unchanged

