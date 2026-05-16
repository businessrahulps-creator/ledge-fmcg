---
name: Landing V2 refit
description: PR17+PR18 landing rebrand — Midnight/Bone/Terracotta/Forest tokens, real-face testimonials, no indigo/#0A0F1C literals
type: design
---

## V2 token map (canonical)
- Midnight `hsl(var(--primary))` — all dark CTAs, badges, hero proof chip bg
- Terracotta `hsl(var(--accent))` — accents, hover bloom, proof chip dot, LedgeIntelligence route pulse
- Forest `hsl(var(--success))` — live-pulse dots (footer, status badges)
- Bone `hsl(var(--background))` / `bg-secondary` — page + footer surfaces

## PR18 — Final sweep
- `lp-btn-primary-dark`, `lp-capsule-cta--dark` → Midnight gradient (was graphite #1F2937→#0A0F1C)
- `lp-capsule-cta` hover bloom + ripple → Terracotta (was rgba(79,70,229,…))
- `lp-proof-chip` → Midnight bg + Terracotta dot (was rgba(10,15,28,…) + #818CF8)
- `lp-mobile-menu-bg`, `lp-menu-link-underline` → semantic tokens
- LedgeIntelligence SVG route → Midnight→Terracotta gradient + Terracotta pulse
- SvgIllustrations constants: `INDIGO`→`#A0522D`, `C`→`#0F1F3A`, EMERALD→Forest `#0E2A22`
- BrowserFrame → rounded-md, bg-card, semantic shadows
- Testimonials: `GradientOrb` REPLACED with 4 AI-generated Indian owner portraits at `src/assets/landing/testimonial-{arnav,priya,dev,rohan}.jpg`
- Footer: bulk migrated to bg-secondary/border-border/text-muted-foreground; emerald pings → `hsl(var(--success))`
- Navbar, MobileMenuOverlay, MobileStickyCtaBar, Pricing, WhyLedge, FinalCTA → all `#0A0F1C` literals swapped for `bg-primary`/`border-border`/etc.

## Rules
- No `#0A0F1C`, `#4F46E5`, `rgba(79,70,229,…)`, `indigo-*`, `violet-*`, `sky-*`, `blue-*` anywhere in `src/components/landing` or `src/index.css`.
- No `GradientOrb` for human avatars — use real portrait images.
- `lp-*` primitive API unchanged; only their internals are recolored.
