# Landing V3.2 — Graphite hero, black-and-white first, blue as punctuation

The palette stays Electric / Ink / Lime / Mist / White, but the *ratio* changes. Today blue is doing the shouting: a full-bleed Electric CTA block, blue buttons everywhere, blue chips inside every product mockup. The new rule is a monochrome page where blue appears rarely enough that it means something.

## 1. Hero background — soft graphite, not fluted stripes

Replace the striped/fluted black hero with the uploaded reference look:

- A smooth diagonal charcoal-to-black gradient (light graphite around the upper-centre-right, falling to near-black at the bottom-left and bottom edge).
- A fine film-grain noise layer over it, generated in CSS (SVG fractal-noise data URI at very low opacity) — no image asset, no extra network request.
- No stripes, no blue glow, no grid overlay in the hero.
- Text stays white; body copy at ~78% white. Primary CTA becomes a white capsule with ink text; secondary is a ghost outline in white.
- The dashboard mockup floats on this ground with a soft dark shadow and a hairline white border.

## 2. Blue budget — where blue is still allowed

Allowed: primary buttons in the nav and pricing, inline text links, the "live" status dot, one accent number or underline per section maximum.

Removed: the full-bleed Electric CTA block (becomes near-black graphite, same treatment as the hero), blue-filled feature icon tiles (become ink-on-mist), blue-tinted section washes, blue chart fills in the illustrations (become ink/grey with a single blue line).

## 3. Section-by-section audit

| Section | Now | After |
| --- | --- | --- |
| Nav | White capsule, blue CTA | Unchanged capsule; CTA stays blue (the one persistent blue) |
| Hero | Fluted black + blue glow | Graphite grain gradient, white CTA |
| Trust / stats | White | White; stat numbers in ink, thin grey rules |
| Problem | Mist | Off-white paper (#FAFAFB); ink featured card stays |
| Features | White | White; icon tiles ink-on-mist, one card allowed a blue accent |
| Outcome | Mist wash | Flat mist, no wash; blue removed from pills |
| Ledge Intelligence | Full-bleed ink | Keeps ink — this is the one dark break mid-page |
| How It Works | White | White; step numerals large in ink, connector line grey |
| Why Ledge | Mist | Mist; hero card ink instead of electric |
| Testimonials | Mist | White so it doesn't stack two mist blocks |
| Founder | White | White; signature rule in ink |
| Pricing | White | White; Growth card keeps the blue button, Scale card stays ink |
| Final CTA | Full-bleed Electric | Full-bleed graphite grain (mirrors the hero, bookends the page) |
| Footer | White | Unchanged |

Rhythm after the change: graphite → white → paper → white → mist → ink → white → mist → white → white → white → graphite → white. Two dark anchors (hero, final CTA), one ink break in the middle, everything else quiet.

## 4. Product mockups

The four regenerated screenshots are heavily blue-chipped. Regenerate them in a monochrome-first UI: grey/ink status chips, ink text, a single blue element per screen (the primary button or the chart line only).

## 5. Technical notes

- New `.lp-block-graphite` class in `src/index.css`: layered `linear-gradient` + `radial-gradient` + SVG `feTurbulence` noise data URI, with descendant token overrides for white text, translucent surfaces and inverted CTAs. Replaces `.lp-block-ink-hero` and `.lp-block-electric`.
- Add a `--lp-paper` token (#FAFAFB) for the softened Problem ground.
- Convert blue icon tiles and pill fills to mist/ink at the CSS layer so section components mostly keep their markup.
- Extend `src/test/brand-placement.test.ts`: assert no `lp-block-electric` usage on section roots and that the graphite class exists.
- Verify with Playwright at 390 / 768 / 1440 and run the full Vitest suite; scoped entirely under `.lp-theme`, so `/app` is untouched.
