## PR18 — Landing V2 Final Sweep

Goal: every pixel on the landing page reads Midnight / Bone / Terracotta / Forest. No indigo, no slate-blue, no `#0A0F1C` literals, no orbs.

### Audit (what's still wrong)

```text
INDIGO / BLUE LITERALS STILL ALIVE
  src/index.css                 :  --ink #4F46E5, --accent-indigo, brand-gradient-cool (lines 26-29, 371-392)
                                   lp-capsule-cta hover/ripple uses rgba(79,70,229,…)        (lines 716, 744, 764)
                                   lp-capsule-cta--dark hover arrow color #C7D2FE             (line 817)
                                   lp-proof-chip dot #818CF8                                  (line 905)
                                   lp-mobile-menu-bg uses #FFFFFF + cool wash                 (line 447)
  GradientOrb.tsx               :  indigo + violet palettes
  DeviceFrames.tsx              :  default variant "indigo"
  SvgIllustrations.tsx          :  INDIGO = "#4F46E5", C = "#0F172A" (steps 1/2/3 + features)
  LedgeIntelligence.tsx         :  route gradient + pulse circles use #4F46E5/#0EA5E9
  Footer.tsx                    :  radial wash rgba(79,70,229,…), bg #FAFAFC, hex #0A0F1C/#52525B/#71717A everywhere, emerald-400/500 pings
  MobileMenuOverlay.tsx         :  #0A0F1C bg/border literals, #16A34A dot, lp-btn-primary-dark (graphite, not Midnight)
  MobileStickyCtaBar.tsx        :  same #0A0F1C literals + lp-btn-primary-dark
  Navbar.tsx                    :  scrolled bg + border + shadow use #0A0F1C, CTA = lp-btn-primary-dark (graphite gradient)
  Pricing.tsx                   :  "Most Popular" badge bg-[#0A0F1C], free-tier CTA uses lp-btn-primary-dark
  WhyLedge.tsx                  :  bg-[#0A0F1C] pill
  FinalCTA.tsx                  :  CapsuleCTA dark variant = graphite (#1F2937→#0A0F1C), trust pill #0A0F1C literals
  Testimonials.tsx              :  uses <GradientOrb /> instead of real faces
  Hero.tsx                      :  proof chip "₹2.4Cr tracked this week" = lp-proof-chip (dark graphite + indigo dot)
```

### Pass A — CSS token rebuild (`src/index.css`)

Single source of truth. Once these are fixed, most components inherit the right look automatically.

1. **Delete legacy indigo tokens** (lines 10-29): `--violet*`, `--ink`, `--accent-indigo`, `--accent-wash`. Replace any consumers with `hsl(var(--primary))` / `hsl(var(--accent))`.
2. **`brand-gradient-cool*` (lines 370-377) and `lp-gradient-bg-cool` (lines 387-393)** → rebuild as Midnight→Terracotta gradient (`hsl(var(--primary))` 0% → `hsl(var(--accent))` 100%) or delete if unused.
3. **`lp-btn-primary-dark` (line 574)** → swap graphite `#1F2937→#0A0F1C` for Midnight `hsl(var(--primary))` with a subtle lift (top stop = `hsl(218 60% 20%)`). Same fix on `lp-capsule-cta--dark` (line 811).
4. **`lp-capsule-cta` hover & ripple (lines 716, 744, 764)** → replace `rgba(79,70,229,…)` indigo bloom with Terracotta `hsl(var(--accent) / 0.22)` bloom and `hsl(var(--accent) / 0.28)` ripple. Hover arrow stays `text-accent` (already correct).
5. **`lp-capsule-cta--dark` hover arrow (line 817)** → `#C7D2FE` → `hsl(var(--accent-foreground))` on Terracotta wash, or simply `hsl(34 47% 96%)` (Bone).
6. **`lp-proof-chip` (lines 882-908)** → background = Midnight (`hsl(var(--primary))`), dot = Terracotta (`hsl(var(--accent))`), keep white text. This is the hero "₹2.4Cr tracked this week" pill.
7. **`lp-mobile-menu-bg` (line 447)** → `#FFFFFF` → `hsl(var(--background))` Bone, washes recolored to `hsl(var(--primary) / 0.05)` and `hsl(var(--accent) / 0.04)`.
8. **`lp-menu-link-underline` background (line 475)** → `#0A0F1C` → `hsl(var(--primary))`.
9. **Anywhere `#0A0F1C` / `#FAFAFC` / `#FAFAFA` / `#1F2937` / `#52525B` / `#71717A` appears in CSS** → semantic tokens.

Regression gate after Pass A:
```bash
rg -n '#4F46E5|#4f46e5|#0A0F1C|#0F172A|#1F2937|#FAFAFC|indigo|sky-[0-9]|violet|blue-[0-9]|rgba\(79,70,229' src/index.css src/components/landing
# must return 0
```

### Pass B — Component-level cleanup

| File | Change |
|---|---|
| `Navbar.tsx` | scrolled `bg-white/65` → `bg-background/75`, border `#0A0F1C/.06` → `border-border`, shadow tokens → `shadow-depth-2`. CTA: drop `lp-btn-primary-dark lp-shimmer` chain; use `bg-primary text-primary-foreground` rounded-full pill (consistent with app). |
| `MobileMenuOverlay.tsx` | Replace all `#0A0F1C/.04` etc. with `bg-muted/border-border`. CTA: `bg-primary text-primary-foreground` rounded-md (Fluent). Dot `#16A34A` → `hsl(var(--success))`. |
| `MobileStickyCtaBar.tsx` | Same Midnight CTA + token swap. |
| `Pricing.tsx` | "Most Popular" badge `bg-[#0A0F1C]` → `bg-primary text-primary-foreground`. Free/Scale/Enterprise CTA: drop `lp-btn-primary-dark`, use `bg-primary` for highlighted, outlined for rest. Hover border `#0A0F1C` → `border-primary`. |
| `WhyLedge.tsx` | `bg-[#0A0F1C]` → `bg-primary`. |
| `FinalCTA.tsx` | Trust pill: WhatsApp button border/shadow tokens → semantic. Keep CapsuleCTA but now its dark variant is Midnight (handled in Pass A). |
| `Footer.tsx` | Bulk swap: `bg-[#FAFAFC]` → `bg-secondary`; all `#0A0F1C/*` → `border-border` / `text-foreground/X`; `#52525B`/`#71717A`/`#A1A1AA` → `text-muted-foreground` / `text-muted-foreground/70`; ambient wash radial recolored to `hsl(var(--accent)/0.06)`+`hsl(var(--primary)/0.04)`; emerald pings → `hsl(var(--success))`. |
| `LedgeIntelligence.tsx` | SVG `LiveRoute`: gradient stops `#4F46E5`/`#0EA5E9` → Midnight→Terracotta; stop dots and pulse `#4F46E5` → `hsl(var(--accent))`; backing path `#E2E8F0` → `hsl(var(--border))`. "Launching Q3" pill bg/border → semantic. Keep CapsuleCTA dark for "Claim my spot" — it'll auto-fix from Pass A. |
| `SvgIllustrations.tsx` | Replace top-level constants `C = "#0F172A"` → Midnight hex `#0F1F3A`, `INDIGO = "#4F46E5"` → Terracotta `#A0522D`. (Even though landing now uses real PNGs in HowItWorks, these illustrations still ship elsewhere — keep the file color-correct.) |
| `DeviceFrames.tsx` | Default `variant = "indigo"` → `"terracotta"`. Rename the variant map: `indigo`→`terracotta` (Terracotta wash), `lavender`→`bone`, keep `emerald`. Update Hero's usage if it passes a variant (it doesn't, so default change is enough). |
| `Hero.tsx` | Proof chip text/dot already render via `lp-proof-chip` — Pass A makes it Midnight + Terracotta dot. No JSX change needed. |
| `GradientOrb.tsx` | Becomes obsolete after Testimonials change. Leave file, remove indigo/violet palettes for safety. |

### Pass C — Testimonials: real owner faces

Replace `<GradientOrb />` with AI-generated portraits.

1. Generate 4 portraits with `imagegen--generate_image` (premium model, transparent_background: false, 512×512, jpg):
   - **Arnav Sethi** — Indian male, 45, beverage factory owner, warm half-smile, kurta over collared shirt, soft natural light, neutral warm background, editorial portrait.
   - **Priya Anand** — Indian female, 38, operations head, confident calm expression, modern saree, soft warm studio light, neutral background.
   - **Dev Sharma** — Indian male, 32, warehouse manager, polo shirt, light beard, friendly, warehouse softly out of focus behind.
   - **Rohan Nair** — Indian male, 29, field sales executive, light blue shirt with no tie, on-the-go portrait, daylight.
   - Save to `src/assets/landing/testimonial-arnav.jpg` etc. Style note in every prompt: "natural skin tones, no AI gloss, magazine cover quality, warm Bone-toned background to match #F5EFE6."
2. Update `testimonials` array in `Testimonials.tsx` with an `avatar` field and import the images.
3. Replace `<GradientOrb seed={t.name} size={40} />` with `<img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-border" />`.
4. QA: open each generated image, confirm no warped faces / weird hands / fake text. Regenerate up to 2x per portrait if needed.

### Pass D — Memory + index

- Append PR18 section to `mem://style/landing-v2-refit.md` with the token map and "no indigo / no #0A0F1C" rule.
- Add a Core line to `mem://index.md`: *Landing: only Midnight/Bone/Terracotta/Forest. No indigo, no #0A0F1C literals, no GradientOrb avatars.*

### Out of scope

- No copy changes, no layout/IA changes, no new sections.
- `lp-*` primitive **API** unchanged; only their internals are recolored.
- No dark-mode landing variant.

### Verification

1. Regression grep above returns 0.
2. Browser screenshot of `/` at desktop + mobile — confirm: nav CTA Midnight, hero proof chip Midnight w/ Terracotta dot, LedgeIntelligence route Terracotta, testimonial cards show real faces, pricing highlighted card Midnight CTA, footer is Bone with no blue wash, mobile menu CTA Midnight.
