# Calm, controlled motion across the landing page

## What changes for visitors
- **Co-Pilot banner removed** from the top of the page (the grey box with "Ledge Co-Pilot is coming… Claim a spot"). The Co-Pilot section further down stays.
- **One calm way things appear.** Each section's heading, text and cards fade up gently once, as you scroll to them. No blurring, no word-by-word or letter-by-letter typing, no flicker.
- **Slower, steadier timing.** Each item takes about half a second to appear. Cards in a row follow each other with a short, even gap and never all at once in a jumble. Nothing replays when you scroll back up.
- **Nothing moves on its own forever.** The scrolling customer-name strip becomes a still row. The pulsing "live" dots stop pulsing.
- **Buttons and cards respond the moment you press** with a tiny, quick press-in. Hover only lifts the card border. No bouncing.
- **Chart, steps, quote slider, price switch and questions** keep their behaviour, with the same calm timing. No springy overshoot.
- **People who turn off motion on their phone or computer** see everything already in place, with no movement at all.

## How it follows the Apple guide
- Respond instantly on press (about 0.1s). Everything else uses one smooth ease-out curve and never starts slowly.
- Motion is only used to show something arriving. Numbers people are reading never move for decoration.
- Anything you interact with (slider, accordion) can be interrupted mid-way with no jump.
- Restraint: the same small set of timings everywhere on the page.

## Technical details
- Delete `AnnouncementBar` usage in `Hero.tsx`.
- `kit.tsx`: replace `InViewTitle` (blur/word variants) in `SectionHead`, Hero and FinalCTA with the shared `Reveal`. `Reveal` uses: opacity 0→1, y 16→0, duration 0.6s, ease `cubic-bezier(0.23,1,0.32,1)`, `viewport={{ once: true, amount: 0.3 }}`. Add a `RevealGroup` with a 70ms stagger, capped at 6 items.
- Hero sample screen: rows render statically (drop the AnimatePresence/blur/spring list), and counters show final values with no count-up.
- `ledge-mono.css`: remove the marquee animation (static centred wrap), remove the `lpx-ping` animation, set card hover to a border change only (no transform), button `:active` scale 0.97 over 100ms ease-out, and remove `transition: all`.
- Arc components (bar chart, stepper, carousel, tabs, accordion, billing toggle): override their springs through `motion-tokens.ts` with critically damped values (damping ratio 1, ~0.4s), with no bounce.
- Global `prefers-reduced-motion` turns `Reveal` into an instant render.
- Verify with Playwright: scroll the page at 1280 and 390 widths and record screenshots mid-scroll, so nothing is left half-visible. Run the full test suite.
