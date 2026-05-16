# Landing Page Rebrand — V2 Ledge System

Bring the landing page onto the same Midnight / Forest / Terracotta / Bone language as `/app`, then replace the abstract SVG placeholders with real-feeling UI imagery (generated via premium image-gen) so the page actually *shows* what Ledge looks like.

Mood reference: the SlowSpace card set you attached — dark navy stage, four oversized Playfair statements on Midnight / Forest / Terracotta / Bone tiles, striped Ledge mark in the corner. That becomes the visual spine.

## Pass 1 — Brand tokens (mechanical, ~13 files)

Drive the entire landing surface off semantic tokens. No new components, no copy changes.

**Token swaps** (every file in `src/components/landing/`):

| Old | New |
|---|---|
| `#4F46E5`, `indigo-*`, `sky-*`, `violet-*` | `hsl(var(--accent))` Terracotta |
| `#0A0F1C`, `#0F172A` headings | `hsl(var(--foreground))` Midnight |
| `#475569` / `#64748B` body | `hsl(var(--muted-foreground))` |
| `#FFFFFF` / `#FAFAFB` section bg | `hsl(var(--background))` Bone (+ warm tints) |
| `#ECEEF2` hairlines | `hsl(var(--border))` |
| `font-extrabold`, `font-black` | `font-semibold` |
| `rounded-2xl`, `rounded-3xl` | `rounded-md` (hero CTA pill stays `rounded-full`) |
| Ad-hoc `box-shadow` on cards | `shadow-depth-4` / `shadow-depth-8` hover |

**Type promotion**: `Hero`, `Problem`, `Outcome`, `HowItWorks`, `Features`, `WhyLedge`, `Pricing`, `Testimonials`, `FinalCTA` H1/H2 → `.h1-display` / Playfair 500.

**`lp-*` mesh retint** (in `src/index.css` only): `lp-mesh-soft-warm`, `lp-mesh-light`, `lp-grid-soft`, `lp-vignette-top` rebuilt off `--background` / `--accent` / `--primary`. Keep the class names so consumers stay stable.

**Regression gates** (must all return 0):
```
rg "#[0-9A-Fa-f]{3,6}|indigo|sky-[0-9]|violet|font-extrabold|font-black" src/components/landing
rg "rounded-(2xl|3xl)" src/components/landing   # 0 except CapsuleCTA
```

## Pass 2 — Primitive reconciliation + SlowSpace-style hero tile set

Reuse app primitives where they earn their place; keep landing-only signatures only where they add value.

**Primitives**
- `.lp-card`, `.lp-card-glass`, `.lp-card-dark` → retire in components, replace with app `.glass-card` + `.card-hover`.
- Keep `.lp-capsule-cta` (signature CTA), `.lp-bento-numeral` (`[ 01 ]` typographic thread), `.lp-noise`, `.lp-vignette-top`.
- Secondary CTAs → app `Button` component.
- Proof chips → app `Badge` / `StatusBadge` variants.

**New `BrandTileGrid` component** (replaces or augments the abstract `Problem`/`Outcome` SVG callouts): four Playfair statements on Midnight, Forest, Terracotta, Bone tiles with the striped Ledge mark in the corner — direct homage to the SlowSpace set. Used once, in the Outcome section.

## Pass 3 — Real product UI imagery (GPT image-gen)

Today's hero, "How it works", and "Features" sections use abstract SVG placeholders (`DashboardSvg`, `BrowserFrame` etc.). We swap them for **premium-generated images of the actual V2 app screens** — Playfair KPI numerals, Terracotta status pills, Bone background, 6px radius. That way the landing literally previews the product.

**Assets to generate** (`premium` model, written to `src/assets/landing/`, imported as ES6 modules):

| File | Used in | Prompt focus |
|---|---|---|
| `hero-dashboard.png` (1600×1040) | Hero right column, inside `BrowserFrame` | Ledge Dashboard: Playfair `₹12,84,500` KPI hero, KpiStrip with 4 tiles, recent-orders table with Terracotta "Pending" / Forest "Delivered" StatusBadges, Bone background |
| `step-orders.png` (1280×880) | HowItWorks step 1 | Orders list, mobile-first, Playfair total, Terracotta "Save" CTA pill |
| `step-stock.png` (1280×880) | HowItWorks step 2 | Stock card with health bar, low-stock Terracotta badge |
| `step-claims.png` (1280×880) | HowItWorks step 3 | Claim detail page, Forest "Approved" badge, signal-line insight |
| `feature-credit.png` (1100×740) | Features grid | "Credit at Risk" promoted SignalCard, large Playfair `₹2.4Cr` |
| `feature-billing.png` (1100×740) | Features grid | GST invoice preview |
| `feature-mobile.png` (900×1400, 9:16) | Hero floating phone or Features | Phone frame showing the mobile order capture flow |

Each prompt is prefixed with the brand spec so the renders feel native:
> "Screenshot of a real SaaS web app called Ledge. Light Bone background (#F5EFE6), Midnight (#0F1F3A) text, Terracotta (#A0522D) accents, Forest (#0E2A22) success. Playfair Display serif for numbers and H1, Inter for everything else. 6px corner radius on every card. Fluent 2 depth shadows. No gradients on cards. No glassmorphism. Crisp, photographic UI screenshot — no illustrations, no abstract shapes."

**QA loop**: render → view each PNG → check for fake-text, palette drift, wrong radius, wrong font → regenerate any that miss. We only commit images that pass.

**Wiring**: `Hero.tsx` swaps `<DashboardSvg />` for `<img src={heroDashboard} />` inside the existing `BrowserFrame`. `HowItWorks.tsx` and `Features.tsx` get an `imageSrc` prop per item. The `DashboardSvg` placeholder stays in the file but goes unused (kept as a fallback during review).

## Section sweep order

`Hero → Problem → Outcome (+ BrandTileGrid) → HowItWorks → Features → WhyLedge → LedgeIntelligence → Pricing → Testimonials → Founder → FinalCTA → Navbar → Footer`

## Out of scope

- No copy rewrites (separate pass).
- No layout/IA changes — same sections, same order.
- No removal of `lp-*` CSS classes from `src/index.css` until every consumer is migrated.
- No app/`/dashboard` changes.
- No dark-mode landing.

## Technical details

- All token work uses HSL via `hsl(var(--token))` per the design-system rule.
- New assets imported as `import heroDashboard from "@/assets/landing/hero-dashboard.png"` — never referenced by raw path.
- `BrandTileGrid` is a single new file: `src/components/landing/BrandTileGrid.tsx`, uses `font-heading` + Midnight/Forest/Terracotta/Bone bg tokens, striped Ledge mark from existing logo asset.
- Memory updates after the PR lands: append `mem://style/landing-v2-refit` (what shipped) and demote `mem://style/landing-parity-checklist` to "executed" status.

## Deliverable

A landing page that, at a glance, is unmistakably the same product as `/app` — same Midnight/Bone/Terracotta language, same Playfair numerals, same 6px cards — with real product screenshots in the hero, "How it works", and Features sections.
