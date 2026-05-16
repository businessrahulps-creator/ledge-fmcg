
# Tinted card system — bring the Slowspace palette to life

Our brand tokens already map 1:1 to the reference: **Midnight (Primary)**, **Forest (Success)**, **Terracotta (Accent)**, **Bone (Background/Secondary)**. The landing page just isn't using them — most cards are white-on-white. This plan introduces a disciplined tinted-card system so the page feels expensive without becoming a circus.

## The principle (the "world-class" guardrail)

> **One tinted card per section, rotating through the four-color palette across the page. Everything else stays neutral.**

This is exactly how the Slowspace cards work: dark backdrop, one card breaks the pattern, the rest stay quiet. Restraint is what makes it feel premium. We are NOT painting every card.

**Color rotation down the page (intentional rhythm):**

```text
Section            Featured tint            Other cards
─────────────────────────────────────────────────────────
Problem            Terracotta (warmth/pain)  white
Why Ledge          Midnight (authority)      white
Features (6 cards) 1 Forest + 1 Terracotta   4 white  ← bento accents
Ledge Co-Pilot     Midnight (already dark)   bone tint
Outcome            Forest (growth)           white
Testimonials       Bone (warm pause)         white
Pricing            Midnight = Scale tier     white + bone
Final CTA          Midnight hero card        —
```

## New primitives (added to `index.css`)

Four utility classes, all built from existing HSL tokens — no new colors:

```text
.lp-card-midnight    bg primary, foreground = primary-foreground
.lp-card-forest      bg success, foreground = success-foreground
.lp-card-terracotta  bg accent,  foreground = accent-foreground
.lp-card-bone        bg secondary (warm bone), foreground = foreground
```

Each variant gets:
- Subtle 1-stop radial vignette in the same hue at 8% (the Slowspace "glow")
- Inset 1px top highlight at 6% white for the lit edge
- Soft warm depth shadow (existing `--shadow-16`)
- The faint Ledge striped-mark watermark top-right at 6% opacity (echoes the Slowspace "SLOW SPACE" corner mark — and reinforces our logo)
- `text-balance`, Playfair headings auto-light on dark variants

Headings inside tinted cards bump from current weight to **Playfair Display** (already loaded), 1–2 sizes up, for the Slowspace editorial feel.

## Per-section changes

**1. Problem.tsx** — Promote "Excel Nights" (or whichever is the emotional peak) to `lp-card-terracotta`. Other three stay neutral. Drives the "bleeding you dry" headline home with warmth.

**2. WhyLedge.tsx** — Wrap the "Built for you" comparison block in `lp-card-midnight`. Tally/Zoho/Vyapar chips become muted-on-dark; the Ledge chip already uses primary, so on Midnight we flip it to bone for contrast.

**3. Features.tsx** — Bento upgrade. Of the 6 feature cards, two get color: **Dealer Intelligence → Forest** (growth), **Returns & Claims → Terracotta** (recovery). The remaining 4 stay white with Midnight icons. This is what makes the grid feel "designed" instead of "generated."

**4. LedgeIntelligence.tsx** — Already Midnight. Add the bone-tinted capability cards (Photo-to-Order, Voice, Smart Schemes, NLQ) sitting on top — currently they're glass. Switch one to `lp-card-bone` to give the Midnight section internal contrast.

**5. Outcome.tsx** — Promote the "outcome hero" left card to `lp-card-forest`. Right column stays white.

**6. Testimonials.tsx** — Feature testimonial gets `lp-card-bone`; satellites stay white.

**7. Pricing.tsx** — The **Scale** tier (currently `bg-primary`) keeps Midnight but gets the new vignette + watermark treatment. **Free** and **Growth** stay white. **Enterprise** gets `lp-card-bone` so we have a 4-card visual hierarchy: bone → white → midnight → bone, climaxing at Scale.

**8. FinalCTA.tsx** — Already Midnight; add vignette + watermark treatment for consistency.

**9. Footer.tsx / Hero.tsx / HowItWorks.tsx / TrustBar.tsx / Founder.tsx / Navbar.tsx** — **Untouched.** They set the neutral baseline that lets the tinted cards pop.

## Why this works

- **Brand recall:** every scroll surfaces one of the four brand colors → repetition without monotony.
- **Hierarchy:** the eye learns "tinted = important" within two sections; we use it to spotlight the offer, the differentiator, and the climax.
- **Restraint:** 8 tinted cards across an entire landing page. Slowspace deck only has 4.
- **Zero new tokens:** everything reuses Midnight/Forest/Terracotta/Bone we shipped in V2 — no design-system drift.
- **One-line revertible:** each tinted card is just a className swap.

## Out of scope (deliberately)
- Repainting Hero, Navbar, Footer, TrustBar, HowItWorks, Founder.
- New color tokens or font additions.
- App (post-login) card refit — landing only, per your request.
- Animations — the existing motion stack stays.

## Verification
Visual scroll-through at 1202px and 390px after implementation; capture each tinted card to confirm contrast, watermark legibility, and headline weight.

Ready to ship on approval.
