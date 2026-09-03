# Landing V3.1 — Kill the neon, go Ink-first

Your read is right. Right now the page is lavender everywhere, lime is shouting where it shouldn't, and warm brown is still leaking out of the old Bone palette. Five moves fix it.

## 1. Hero becomes the black slab

The hero takes the near-black Ink treatment from your reference image: a deep ink ground with soft vertical "fluted" light bands falling across it, headline and body in white, muted copy in a light slate, primary CTA in white with ink text, secondary CTA as a hairline ghost button. The top nav sits on that dark ground with a translucent white pill treatment and reads white until the user scrolls past the hero, at which point it returns to the light pill it uses today. The dashboard mockup stays as-is and gains a soft light halo so it lifts off the black.

## 2. Lime gets demoted from colour to punctuation

New lime law, enforced page-wide:

- Never lime text on a light background.
- Never a lime status pill in the product visuals — the "Slow" chip becomes a neutral ink/slate chip, and the live dots become Electric.
- Lime survives only as: a highlighter fill behind one or two words (Ink text on lime), a thin underline swoosh, and single small dots on Ink/Electric blocks.

Net effect: lime appears roughly four times on the whole page instead of forty.

## 3. Total warm purge

Every remaining brown/bone value gets replaced. Confirmed leaks:

- Landing primitive backgrounds and gradients in the stylesheet still hardcode the old bone/terracotta hues (icon tiles, paper sections, cards, mobile menu, glow bars).
- Inline warm chips in Outcome ("Same factory. Same field." pill, the icon tiles), Pricing and How It Works.
- The whole SVG illustration palette (bone zebra, terracotta accents, warm hairlines).
- The Ledge loading screen, whose glow is a terracotta radial.

All of it maps to White / Mist / Ink / Electric, with Lime only per the rule above.

## 4. Footer goes white

The footer moves from lavender-blue to a clean white ground with a hairline top rule, ink headings, slate links, and the status card as a light bordered surface. The WhatsApp button loses its green tint and becomes a neutral pill with the brand-green icon only.

## 5. Section rhythm

Fixed alternation so the page reads as deliberate blocks rather than one wash:

```text
Hero            INK (black slab)
Trust bar       WHITE
Problem         MIST
Features        WHITE
Outcome         MIST
Intelligence    INK
How it works    WHITE
Why Ledge       MIST
Founder         WHITE
Pricing         WHITE
Final CTA       ELECTRIC
Footer          WHITE
```

## Technical notes

- New `.lp-block-ink-hero` ground: layered `repeating-linear-gradient` flutes plus a vertical falloff, with token overrides so children inherit correct on-dark colours; no new images.
- Replace all hardcoded `hsl(34 …)` / `hsl(19 …)` / `hsl(22 …)` values inside the `.lp-theme` scope and in the landing components with the V3 tokens; the same purge runs on `SvgIllustrations.tsx` constants and `SplashScreen.tsx`.
- Nav colour state driven by an existing scroll listener; no new dependency.
- `/app` stays on V2 — nothing outside the landing scope, illustrations, and the splash screen is touched.
- Verification: typecheck, full Vitest (brand-placement contract updated to ban warm hues and lime-on-light), plus screenshots at 390 / 768 / 1440 to confirm contrast on the black hero and white footer.
