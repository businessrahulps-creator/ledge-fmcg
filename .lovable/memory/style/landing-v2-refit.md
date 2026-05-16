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

## PR19 — Final polish & parity sweep
- Killed all `rgba(15,23,42,…)`, `rgba(79,70,229,…)`, `rgba(99,102,241,…)`, `#E5E7EB`, `#E2E8F0`, `#94A3B8`, `#475569` from `src/index.css` + `src/components/landing` (only intentional `Nilavilakku` gold + `constants.ts` WhatsApp/Mac-dots remain).
- New `src/components/landing/constants.ts` holds `WA_GREEN`, `WA_GREEN_DARK`, `WA_TEXT`, `MAC_DOTS` as documented exceptions. Footer + MobileStickyCtaBar + MobileWhatsAppFab consume from it.
- `WhatsAppIcon` now accepts `style` prop.
- Deleted `GradientOrb.tsx` (zero consumers).
- `DeviceFrames.tsx` rewritten: PhoneFrame chassis = Midnight gradient, notch = `bg-primary`, BrowserFrame inner wrapped in `rounded-[4px] overflow-hidden`, GradientStage variants renamed `terracotta|bone|emerald` (default `terracotta`).
- `SvgIllustrations.tsx`: hairline `#E5E7EB`→`#E8E1D4`, muted/faint to Midnight-tinted, product dots → brand hexes, comments de-indigo'd.
- Hero proof chip moved inside BrowserFrame (bottom-right) so it reads as a product notification, not a sticker.
- Pricing highlighted tier: added `border border-primary/40 shadow-depth-8` + focus-visible ring on CTAs.
- Features icons promoted to `.icon-signal` weight (20px, stroke 2, 40×40 tile).
- Navbar CTA dropped `lp-shimmer` (kept on Hero CapsuleCTA only) + focus-visible ring.
- MobileMenuOverlay CTA label "Get Started Free" → "Start Free Trial" for parity with desktop + focus-visible ring.
- `lp-capsule-cta` got `focus-visible` outline. `lp-shimmer-dark` sheen now Terracotta-tinted.
- Section paddings tightened: `py-24 md:py-32 lg:py-36` → `py-20 md:py-28` across all landing sections (FinalCTA, Footer included).

## Rules (updated)
- Off-palette literals are forbidden except: `Nilavilakku.tsx` (intentional gold) and `constants.ts` (WhatsApp + Mac chrome).
- BrowserFrame children should be wrapped in something that respects the inner `rounded-[4px]` corner.
- Use `.icon-signal` for promoted feature/KPI icons on landing.
