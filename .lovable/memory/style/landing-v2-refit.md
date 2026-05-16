---
name: Landing V2 refit (Pass 1 + product imagery)
description: First landing rebrand pass shipped — lp-* primitives retinted to Midnight/Bone/Terracotta/Forest, hero & HowItWorks now use real product UI screenshots.
type: design
---
Shipped in the landing-v2 PR. Executes Passes 1 + 3 from `mem://style/landing-parity-checklist`.

## CSS primitive retint (src/index.css ~L380-996)
All `lp-*` primitives now drive off semantic V2 tokens (no raw hex):
- `.lp-mesh-light` → `hsl(var(--background))` Bone
- `.lp-section-paper` → `hsl(34 35% 91%)` warm Bone tint
- `.lp-mesh-soft-warm` / `.lp-mesh-dark` → Bone + Terracotta/Midnight radial wash
- `.lp-grid-soft` → `hsl(var(--primary) / 0.07)` dots
- `.lp-card`, `.lp-card-glass`, `.lp-card-dark` → `rounded-md` (6px), Midnight-tinted shadows
- `.lp-eyebrow` dot → `hsl(var(--accent))` Terracotta
- `.lp-icon-tile` → Bone bg + `rounded-md`
- `.lp-pill-accent` → Terracotta gradient (was indigo)
- `.lp-glass-frost` → Bone tint + Terracotta bloom
- `.lp-progress-glass` → Terracotta gradient
- `.lp-bento-hero` → Terracotta wash on warm Bone (was indigo/sky)
- `.lp-live-dot` → `hsl(var(--success))` Forest
- `.lp-capsule-cta` hover bloom → Terracotta

## Section files (sed-swept)
Bulk hex→semantic-token migration across all `src/components/landing/**/*.tsx`:
- `#0A0F1C`/`#0F172A`/`#1F2937` → `text-foreground`
- `#475569`/`#64748B`/`#3B3F66` → `text-muted-foreground`
- `#94A3B8` → `text-[hsl(var(--muted-foreground)/0.7)]`
- `#4F46E5`/`#3730A3` → `text-accent`
- `#ECEEF2` → `border-border`
- `font-extrabold`/`font-black` → `font-semibold`

Remaining raw hex confined to `DeviceFrames.tsx` (macOS chrome traffic lights — intentional) and `GradientOrb.tsx` (decorative, unused in main flow).

## Product UI imagery (premium image-gen)
Replaced abstract SVG placeholders with photographic-quality product screenshots:
- `src/assets/landing/hero-dashboard.png` — Hero right column (Dashboard with ₹12,84,500 Playfair KPI, 4-tile strip, Recent Orders table with Forest/Terracotta status pills, Midnight sidebar)
- `src/assets/landing/step-orders.png` — HowItWorks 01 (mobile New Order, ₹1,24,500 Playfair total, Terracotta Save button)
- `src/assets/landing/step-stock.png` — HowItWorks 02 (Stock Health table with health bars, Indian FMCG SKUs)
- `src/assets/landing/step-billing.png` — HowItWorks 03 (GST Invoice with CGST/SGST breakdown, Forest "Paid" pill)

Each prompt prefixed with brand spec: Bone bg, Midnight text, Terracotta accents, Forest success, Playfair numbers + Inter UI, 6px radius, no glassmorphism. All four passed visual QA on first render.

## Wiring
- `Hero.tsx` — `<DashboardSvg />` → `<img src={heroDashboard} />` inside `<BrowserFrame>`
- `HowItWorks.tsx` — removed `PremiumStage`/`PhoneFrame`/`BrowserFrame` SVG wrappers, introduced inline `ProductShot` that uses `lp-glass-frost` stage + Terracotta bloom

## Not yet shipped (Pass 2 backlog)
- `.lp-card` / `.lp-card-glass` / `.lp-card-dark` retire-in-favor-of `.glass-card` (CSS retinted instead, so visual gap is now small)
- `BrandTileGrid` SlowSpace-style four-statement tile homage in Outcome section
- `feature-credit.png` / `feature-mobile.png` for Features grid
- Hex cleanup in `DeviceFrames.tsx` / `GradientOrb.tsx` / `MobileMenuOverlay.tsx`
- Navbar / Footer audit
