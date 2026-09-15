# Back to the original splash — refined, not replaced

The ribbon goes. We return to the earlier composition — Ledge mark, wordmark, thin progress line, one honest caption, centred — and raise its craft instead of reinventing it. The way Apple and Google do launch screens: one still, centred lockup on a calm field, motion so restrained you barely register it, and everything typographically exact.

## What comes back

The previous layout exactly as it was: striped-square mark, "Ledge" in Playfair beneath it, slim progress line, caption line, Retry line after a slow start.

## What gets better

**The field.** Midnight, almost flat — the current radial wash is too visible and reads like a gradient wallpaper. Replace with a barely-there luminance lift behind the lockup so the centre feels lit rather than painted. The breathing glow ring is removed; it is the single most "AI template" element on the screen.

**The mark.** Stripes still draw in, but as one coordinated gesture: shorter stagger, a firmer ease, each stripe growing from the left with a subtle lead-in rather than four separate pops. The mark sits on an invisible optical centre, nudged up so the lockup as a whole is balanced against the caption below it — the Apple trick of optical, not mathematical, centring.

**The wordmark.** Larger, tighter tracking, and the space between mark and word set on a real rhythm instead of a round number. It fades in on a short overlap with the mark's last stripe, so the two read as one lockup arriving, not two events.

**The progress line.** Thinner, shorter, lower contrast, with rounded ends — Google's material determinate feel. Its indeterminate sweep gets a gentler curve so it glides rather than shuttles. When a real percentage arrives it moves to it smoothly; the jump to 100% on finish eases instead of snapping.

**The caption.** Kept — honest loading text is worth more than silence. Smaller, calmer colour, and it cross-fades between steps instead of hard-swapping the text.

**The exit.** The lockup settles up by a few pixels as the whole screen dissolves, and it holds for a minimum moment so a fast start never flashes. Handoff to the dashboard stays a single smooth fade.

## Kept as is

- `window.__ledgeSplash` step/done bridge and every call from `main.tsx` and `DataContext`
- The 10s slow-connection line with Retry, the 30s auto-dismiss, the 6s safety net
- Reduced-motion path: everything already in place, fade only

## Technical notes

- All inline in `index.html`; no images, no fetched fonts, same payload class as before.
- `step(label, pct)` becomes meaningful again — the caption and bar are back.
- Playfair falls back to a styled serif, since the splash usually finishes before webfonts land.
- Nothing outside `index.html` changes; no data, totals, permissions or business logic touched.
