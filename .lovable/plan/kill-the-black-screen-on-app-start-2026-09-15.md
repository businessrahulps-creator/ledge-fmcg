# Kill the black screen on app start

Right now the phone shows nothing at all for the first several seconds. That gap exists because the page is an empty shell until the app's code downloads, starts, and draws the first screen. Nothing visual can come from the app itself during that window — so the opening animation has to live in the page itself and start painting on the very first frame.

## What the user will see

1. **Instantly (first frame, before any app code runs)** — a Midnight screen with the Ledge striped-square mark drawing itself in, the wordmark fading up under it, and a slim progress line that keeps moving. No blank moment at any point.
2. **While the app boots** — the progress line advances and the caption changes with real milestones, so it never feels frozen:
   - "Starting Ledge"
   - "Signing you in"
   - "Loading your business"
3. **When the first screen is ready** — the splash lifts away: mark scales up slightly, screen fades, the dashboard is already behind it. One smooth handoff, no flash of white.
4. **If it takes unusually long (over ~10s)** — a quiet line appears: "Slow connection — still loading" with a Retry link, so a stuck start is never a mystery.

On desktop the same animation runs but shorter and more restrained, since the boot there is fast.

## Creative direction

The mark builds the way a ledger is written: the striped square draws stripe by stripe (staggered, bottom-up), then settles. Midnight background with a soft Bone-toned glow behind the mark, Terracotta accent on the progress line. Playfair wordmark fades in after the mark completes. Respect `prefers-reduced-motion`: static mark plus a gentle pulse only.

## Technical notes

- Add the splash markup + keyframes **inline in `index.html`** (inside `#root`'s sibling, styled with an inline `<style>` block). Inline is essential — an external CSS or JS file would arrive too late to fix the very gap we're closing. Keep it under ~4KB, no images, mark drawn as inline SVG.
- Expose `window.__ledgeSplash = { step(label), done() }` from that inline script.
- Call `step()` from the existing boot path: `src/main.tsx` (app code running), auth ready, and the DataContext phase‑1 commit; call `done()` once the first route has painted (double `requestAnimationFrame` after mount) so the fade never reveals an empty page.
- Splash removes itself from the DOM after the fade so it never traps taps.
- Safety net: auto-`done()` after 30s, and always `done()` if the error screen renders.
- `theme-color` is already Midnight, so the phone's status bar matches the splash and the PWA launch screen blends into it.
- Also add Midnight `background-color` to `html, body` so the browser's own pre-paint canvas is Midnight rather than black/white.

Nothing about data, totals, permissions or business rules changes — this is startup presentation only.

## Out of scope

Making the boot itself faster is separate work already tracked; this change removes the *appearance* of a dead app during that boot.
