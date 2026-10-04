# Slower, weightier motion across the landing page

Make every movement on the landing page feel heavier, slower and more deliberate, like a premium product page. Nothing bounces, nothing snaps. Things settle into place.

## What changes for you
- **Sections appearing as you scroll:** they rise further and more slowly (about 1 second instead of 0.6), with a long, soft finish so they "land" instead of popping in. Items in a row follow each other with a clear rhythm rather than all at once.
- **Headline at the top:** the lines arrive one after another, slowly, before the diagram fades in. This gives the page a calm opening.
- **Top diagram:** the loop slows from 9 to about 12 seconds. Dots ease out of and into each box, the Ledge box "breathes" once instead of pulsing quickly, and the status text fades more slowly.
- **Buttons and cards:** pressing a button sinks it a little more slowly. Moving the mouse over a card changes it over about 0.3 seconds instead of instantly.
- **Bots:** they move more slowly and turn their heads less, so they feel calm rather than twitchy.
- **Top menu:** its springy entrance gets replaced with the same slow, settled fade as the rest of the page (this was left over from last time).
- **Price switch, question list, customer quotes:** opening, closing and sliding all slow down and use the same soft finish.
- **Reduced motion:** still switches everything off.

## Review
- Fable 5.1 designs the exact timings, then reviews frame-by-frame screenshots taken while scrolling on computer, tablet and phone.
- Astra (high reasoning) reviews the whole page for anything that still feels fast, jumpy or out of step. It also checks that slow doesn't become sluggish: things you tap still respond at once, and text is never left half-faded while you read.
- I'll apply their fixes, then do a second round of screenshots.

## Checks
- Screenshots mid-scroll at 1280, 768 and 390 wide, with nothing stuck half-visible.
- Smooth playback (no dropped frames) in the top diagram.
- All automated checks pass.

## Technical details
- `kit.tsx` tokens: `EASE` to `[0.16, 1, 0.3, 1]`, `REVEAL_S` 0.6 to ~1.0, `STAGGER_S` 0.07 to ~0.12, reveal distance 16 to ~28px, viewport amount ~0.25. Add `DUR` scale (press 0.16, hover 0.32, panel 0.5, reveal 1.0) in one place.
- `motion-tokens.ts`: all Arc enters/springs use the new duration and ease (bounce 0).
- `ledge-mono.css`: CSS custom properties `--lpx-ease`, `--lpx-dur-*` replace hardcoded transition times; button `:active` 160ms; card hover 320ms; `lpx-flow-swap` 0.3s to 0.6s.
- `LedgeFlowHub.tsx`: loop period and story start/end times scaled to ~12s; segment progress uses an ease-in-out curve; hub pulse becomes one slow scale (1 to 1.04 over ~0.8s).
- `Navbar.tsx`: replace spring entrance with the shared `Reveal` timing.
- `LandingBot.tsx`: `speed` 0.8 to ~0.55, `turn` 0.6 to ~0.4.
- Fable/Astra outputs drive final numbers; record the motion rule in `src/components/landing/AGENTS.md`.
