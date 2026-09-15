# A splash screen worth the brand

The reference works because it does almost nothing: a deep near-black field, one confident gradient ribbon that owns the frame, a quiet wordmark set low, and the company lockup pinned at the bottom. No spinner, no progress bar, no captions. Ours currently reads cheap because it stacks four competing elements — small logo, wordmark, progress bar, status caption — dead centre with a glow behind them.

## What replaces it

**The field.** Near-black Midnight, edge to edge, with a faint vignette. Nothing else competing.

**The ribbon.** A single continuous ribbon curve — one long stroke that loops twice and exits both edges of the frame, exactly the way the reference does. Drawn as one path with a gradient running along its length: deep indigo → Midnight-blue → a warm Terracotta/amber tail. Thick, smooth, tapering slightly at the ends. It occupies the upper two-thirds of the screen and is deliberately cropped by the edges, which is what makes it feel like a designed object rather than a centred logo.

**The motion.** The ribbon draws itself, head to tail, in one unbroken 1.1s stroke with a slow ease — the line arrives as if being written. As the stroke completes, the gradient warms through. The wordmark fades up beneath it a beat later. Everything is one gesture; nothing bounces, pulses or spins.

**The wordmark.** "Ledge" in Playfair, large, low in the frame, generous letter-spacing, Bone white. Nothing under it.

**The footer.** The striped-square Ledge mark plus a small "FMCG operations" line at the very bottom, low opacity — the company-lockup position from the reference.

**The exit.** When the first screen is ready, the whole composition drifts up a few pixels and dissolves while the ribbon's warm tail brightens briefly. Single smooth handoff into the dashboard.

## What gets removed

- Progress bar and percentage
- Rotating status captions ("Signing you in", "Loading your business")
- Centre glow and the breathing animation
- The small centred mark and the current stacked layout

Honesty is kept without the chatter: if the start drags past 10 seconds, one small line fades in at the bottom — "Still loading — slow connection" with a Retry link. Below 10 seconds the user sees only the animation.

## Technical notes

- Stays entirely inline in `index.html` so it still paints on the first frame before any app code exists; the existing `window.__ledgeSplash` step/done bridge, the 6s safety net, the 30s auto-dismiss and the calls from `main.tsx` / `DataContext` all stay wired. `step()` becomes a no-op for captions since there are none.
- Ribbon is one inline SVG `<path>` with an SVG `linearGradient`, animated with `stroke-dasharray` / `stroke-dashoffset`, `stroke-linecap: round`. `preserveAspectRatio="xMidYMid slice"` so it crops rather than shrinks on any screen.
- Portrait phone is the design target; on wide screens the ribbon scales and crops the same way.
- `prefers-reduced-motion`: ribbon appears already drawn, simple opacity fade only.
- Budget stays under ~5KB inline, no images, no fonts fetched (Playfair with a serif fallback — the splash is gone before webfonts matter, so the fallback is styled to look intentional).

No data, totals, permissions or business logic touched — this is the startup screen only.
