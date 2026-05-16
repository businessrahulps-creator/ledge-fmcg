## PR19 — Landing Final Polish & Parity Audit

After PR18 the landing reads Midnight/Bone/Terracotta at first glance, but a code-level audit still finds **148 raw hex/rgba hits** and several UX gaps versus the app. This pass closes all of them in one shot.

### A. Color residue still in the code (must be zero after this PR)

**`src/index.css`**
- Line 425, 1035–1037, 1070–1071: shadows + bottom-fade still use `rgba(15,23,42,…)` (legacy slate). Swap to `hsl(var(--primary) / x)` so depth is Midnight-tinted.
- Line 1006: `lp-card-glass` cursor glow = `rgba(99,102,241,…)` (indigo). Swap to `hsl(var(--accent) / 0.10)` (Terracotta).
- Line 1039: `lp-card-glass` hover border = `rgba(99,102,241,0.22)`. Swap to `hsl(var(--accent) / 0.22)`.
- Line 1091–1092: drop-shadow filter uses indigo `rgba(79,70,229,…)`. Swap to accent.
- Line 862: hardcoded `#94A3B8` text. Swap to `hsl(var(--muted-foreground))`.

**`src/components/landing/illustrations/SvgIllustrations.tsx`** — the file used in `Features.tsx`; still indigo/slate inside:
- `C_MUTED #475569`, `C_FAINT #94A3B8`, stroke `#E5E7EB`, fills `#FFFFFF` everywhere → switch to a small palette derived from Midnight + neutrals (`#0F1F3A` muted/faint tints, `border` `#E8E1D4` Bone-tinted, surface `#FFFFFF` is fine).
- Line 122: gradient stop `rgba(79,70,229,0.10)` indigo. → Terracotta.
- Lines 318–321 product dots `#F59E0B / #3B82F6 / #10B981 / #F43F5E`: replace with `accent / primary / success / destructive` HSL hexes so chips read as brand.
- Comments still say "indigo accent" / "solid indigo" — rename to "accent".

**`src/components/landing/GradientOrb.tsx`** — still ships 6 indigo/violet/sky/emerald palettes even though Testimonials no longer use it. Delete the file (and remove the no-longer-needed import in `Outcome.tsx` if any). Verify with `rg "GradientOrb"`.

**`src/components/landing/DeviceFrames.tsx`**
- macOS dots `#FF5F57 / #FEBC2E / #28C840` — keep (real Mac chrome convention) but pull into a single `MAC_DOTS` const for clarity.
- URL bar border `#E8E5E0`, text `#A8A29E` → semantic `border-border` / `text-muted-foreground`.
- PhoneFrame gradient `#18181B → #2A2A2E` (graphite) → Midnight gradient (`hsl(218 60% 14%) → hsl(218 60% 20%)`).
- Notch `#1A1A1A`, status dots `#1A1A1A` → `bg-primary`.
- All shadow `rgba(15,23,42,…)` → Midnight-tinted.
- Variant washes use `rgba(13,148,136,…)` teal — swap to Terracotta/Bone tints; rename variants if needed.

**`src/components/landing/MorphHamburger.tsx`** — inline shadow `rgba(15,23,42,…)` → Midnight tint.

**`src/components/landing/MobileStickyCtaBar.tsx`** — WhatsApp button hardcodes `#25D366 / #0F5132`. WhatsApp green is a brand color, **keep** it but pull into a single `WA_GREEN` token in a `landing/constants.ts` so it's documented and not stray hex.

**`src/components/landing/MobileWhatsAppFab.tsx`** — same; consume from `WA_GREEN`.

**`src/components/landing/Nilavilakku.tsx`** — gold/amber palette is intentional brand moment (lamp). Add a header comment "INTENTIONAL: gold gilt palette, do not migrate." Leave colors as-is.

Regression gate (must return 0):
```bash
rg -n 'rgba\(15,23,42|rgba\(79,70,229|rgba\(99,102,241|#4F46E5|#0F172A|#0A0F1C|#1F2937|#475569|#94A3B8|#E5E7EB|indigo|sky-[0-9]|violet|blue-[0-9]' src/index.css src/components/landing 2>/dev/null | grep -v Nilavilakku
```

### B. UX/structure gaps vs the app

These came up while re-screenshotting the live page:

1. **Massive vertical gaps between sections.** The screenshots show ~400px of empty Bone between Testimonials → Pricing and Hero → Features. Tighten section paddings to `py-20 md:py-28` (matches app density) and drop any duplicate `pt-24` on sections that already follow a section.
2. **Navbar CTA still feels heavy.** "Start Free Trial" is a solid Midnight pill (correct) but uses `lp-btn-primary-dark lp-shimmer` — the shimmer is the old graphite shimmer. Either retune the shimmer to a Terracotta sheen at low opacity, or drop it on the small nav size and keep shimmer only on the Hero CapsuleCTA.
3. **Hero proof chip is detached.** It floats below the BrowserFrame against empty Bone; on desktop it visually orphans. Move it inside the frame's bottom-right corner (like a real notification toast) so it reads as part of the product, not a sticker.
4. **Features grid icons are flat lucide outlines.** The app uses three icon weight tiers (`.icon-nav / .icon-inline / .icon-signal`). Apply `.icon-signal` (20px, stroke 2) to the Feature card icons so they match the app's promoted-surface treatment.
5. **No `SignalCard` mirror on landing.** The app's signature primitive is the tier-stripped SignalCard at top of every page. Landing has nothing analogous. Add ONE faux SignalCard inside the Hero BrowserFrame (e.g. "Credit at Risk · ₹3.2L · 4 dealers") as a static screenshot-style element so visitors recognize it the moment they sign up. This is the single highest-leverage parity move.
6. **Pricing "Most Popular" highlight is weak.** Currently just a Midnight badge on a Bone card. Add a `depth-8` shadow + 1px primary border to the highlighted tier, matching the app's `.card-hover` press state at rest.
7. **Footer is correct color but cold.** Add one warm `hsl(var(--accent) / 0.04)` radial wash top-right + a thin `section-divider` above the bottom legal row so it doesn't feel like a wall of muted text.
8. **Mobile menu CTA labels don't match desktop.** Desktop says "Start Free Trial"; mobile overlay says "Get Started". Standardize to "Start Free Trial" everywhere.
9. **No focus-visible parity.** Landing CTAs use ad-hoc focus styles; app uses `focus-visible:ring-2 ring-ring ring-offset-2`. Apply the same chain to `lp-btn-primary-dark`, `lp-capsule-cta`, and the nav CTA.
10. **Hero image lacks a "BrowserFrame chrome consistency with app."** The `BrowserFrame` URL bar now reads `app.ledge.in/dashboard` but the chrome border radius is `rounded-md` (6px) while the inner image is square — wrap the `<img>` in `rounded-[4px] overflow-hidden` so the corners match.

### C. Files touched

- `src/index.css` — token cleanup section A.
- `src/components/landing/illustrations/SvgIllustrations.tsx` — palette swap + comments.
- `src/components/landing/DeviceFrames.tsx` — Midnight chrome, semantic borders, image inner radius, optional faux SignalCard slot.
- `src/components/landing/GradientOrb.tsx` — **delete**.
- `src/components/landing/MorphHamburger.tsx` — Midnight shadow.
- `src/components/landing/MobileStickyCtaBar.tsx`, `MobileWhatsAppFab.tsx`, new `src/components/landing/constants.ts` — single `WA_GREEN` token.
- `src/components/landing/sections/Hero.tsx` — move proof chip inside BrowserFrame; add inline SignalCard mirror.
- `src/components/landing/sections/Features.tsx` — apply `.icon-signal` to icons.
- `src/components/landing/sections/Pricing.tsx` — highlight depth-8 + primary border.
- `src/components/landing/sections/Footer.tsx` — warm wash + divider.
- `src/components/landing/sections/Navbar.tsx`, `MobileMenuOverlay.tsx` — CTA label parity, focus-visible chain, shimmer retune.
- `src/components/landing/CapsuleCTA.tsx` — focus-visible chain.
- All section files — section padding pass (`py-20 md:py-28`).
- `.lovable/memory/style/landing-v2-refit.md` — append PR19 section.

### D. Out of scope

- No copy/IA changes (only the mobile menu CTA label is synced).
- No new sections.
- `Nilavilakku.tsx` palette stays gold (intentional brand moment).
- WhatsApp green stays `#25D366` (third-party brand color, documented as exception).
- App pages untouched.

### E. Verification

1. Regression grep above returns **0** outside `Nilavilakku.tsx` and `constants.ts`.
2. Browser screenshots at desktop 1280 + mobile 390 of: Navbar (idle + scrolled), Hero with proof chip inside frame, Features card with icon, Pricing highlighted card, Mobile menu overlay, Footer.
3. `rg "GradientOrb"` returns 0.
4. Tab through Hero, Navbar, Pricing CTAs — every focused element shows the app's ring.