# How It Works — image-free, motion-driven three-step rail

Replace the three full-height product screenshots with a compact, animated step sequence. Same story, roughly one third the scroll height, three fewer image downloads.

## What changes

**Layout**
- One horizontal three-column rail on desktop, stacked cards on mobile — instead of three alternating image/text rows.
- A thin progress rail runs behind the steps. As the section enters the viewport, the rail draws left-to-right (top-to-bottom on mobile) and each step node lights up in sequence.
- Section height drops from roughly three full screens to about one.

**Each step**
- Numbered node (01 / 02 / 03) with the existing Smartphone / Dashboard / Truck icon, drawn in the monochrome V3.2 style (ink on mist, no blue tiles).
- Headline and one-line description kept exactly as written today.
- A small live micro-visual built purely from HTML/CSS/SVG — no image files:
  - Step 01: a miniature order line building itself — dealer chip, two product rows typing in, then a "Saved · ORD-1042" confirmation stamp.
  - Step 02: three stock health bars filling to their level, one dropping into a low-stock state with a quiet pulse.
  - Step 03: a dispatch tick that cascades into a stock number counting down and a GST total counting up to ₹50,150.
- Micro-visuals animate once on scroll-in (`whileInView`, `once: true`) and respect `prefers-reduced-motion` — reduced motion renders the final state with no animation.

**Blue budget** — one Electric accent for the section: the progress rail fill. Everything else stays ink, mist and white per V3.2.

## Files

- `src/components/landing/sections/HowItWorks.tsx` — rewritten: drop the `ProductShot` component and the three `stepOrders` / `stepStock` / `stepBilling` imports, add the rail + step cards.
- `src/components/landing/visuals/StepMicroVisuals.tsx` — new file holding the three self-contained animated visuals (Framer Motion + existing `spring` tokens).
- `src/assets/landing/step-orders.webp`, `step-stock.webp`, `step-billing.webp` — deleted once nothing imports them.
- `src/test/brand-placement.test.ts` — add an assertion that HowItWorks imports no `.webp` asset, so screenshots can't creep back in.

## Verification

- Full Vitest suite and build.
- Playwright capture at 390 / 768 / 1440 to confirm the rail alignment, the reduced scroll height and the step sequencing.
- Confirm the three deleted assets are gone from the production bundle.
