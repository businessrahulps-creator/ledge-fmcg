# Hero visual swap — 3D flow illustration

Replace the dashboard screenshot in the landing hero with the uploaded 3D illustration (phone with orders, invoices, rupee coins and pallets flowing through it), kept inside the existing macOS browser frame.

## What changes

- Convert the uploaded PNG (1448x1086, 1.7 MB) to an aggressively compressed WebP at ~1440px wide, quality tuned for the smallest file that still looks clean (target well under 150 KB).
- Save as `src/assets/landing/hero-flow.webp` and delete the old `hero-dashboard.webp` (676 KB) once no references remain.
- Point `Hero.tsx` at the new image: updated `src`, `width`/`height` matching the new 4:3 aspect, new descriptive alt text, keeping `fetchPriority="high"` and `decoding="async"`.
- Keep the `BrowserFrame` wrapper, the glass stage, the tilt/float motion, and the "₹2.4Cr tracked this week" proof chip exactly as they are.
- The frame URL label stays `app.ledge.in/dashboard`.

## Notes

The illustration is dark-navy, so it sits naturally on the graphite hero; no contrast fixes expected. If the browser frame's light title bar reads oddly against the dark artwork, I'll leave it as-is unless you flag it — the frame styling is shared with other sections.

## Verification

Build, run the landing tests, and screenshot the hero at 390px and 1440px to confirm framing and no layout shift.
