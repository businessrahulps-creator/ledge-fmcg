

# Upgrade Mobile Nav Icons to Match Landing Page Quality

## Problem
The mobile navigation uses generic, AI-typical Lucide icons (`Home`, `Sparkles`, `RefreshCw`, `CreditCard`) that feel basic compared to the purposeful, specific icons used throughout the landing page sections.

## Icon Replacements

| Link | Current Icon | New Icon | Why |
|------|-------------|----------|-----|
| Home | `Home` | `LayoutDashboard` | Matches the dashboard-first identity used in Features section |
| Features | `Sparkles` | `Layers` | Already used in Features section for the product itself |
| How It Works | `RefreshCw` | `Route` | Matches the lifecycle/journey metaphor used in Features |
| Pricing | `CreditCard` | `IndianRupee` | Matches the billing icon used in Features section — more relevant for Indian FMCG |

These are the exact same icons already used on the landing page's Features section, so the nav will feel cohesive rather than disconnected.

## File changed
**`src/components/landing/sections/Navbar.tsx`** — swap the 4 icon imports and update the `links` array. Also reduce `strokeWidth` to `1.5` for a thinner, more refined look.

