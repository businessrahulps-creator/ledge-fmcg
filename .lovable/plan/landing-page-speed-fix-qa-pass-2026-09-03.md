# Landing page speed fix + QA pass

## What I measured

Live site (`getledge.in`, mobile viewport, fast connection): first paint of text at **1.86s**, page settles at **1.9s**, **950 KB** downloaded — and **502 KB of that (53%) is the PDF engine**, which the landing page never uses. On an Indian 4G phone that single chunk is roughly 3-6 extra seconds of blank screen.

Local dev preview itself is healthy (server responds in 8ms, build is clean), so this is a bundling problem, not a server problem.

## Root causes found

1. **The PDF library ships on every page load.** `vite.config.ts` forces `@react-pdf/renderer` into a manual chunk (`vendor-pdf`). Rollup then stranded a couple of tiny shared helper functions inside that chunk, and the app's main entry file imports them — so the browser must download all 502 KB before the landing page can start. Confirmed by inspecting the live bundle: the entry chunk contains `import{c,a}from"./vendor-pdf-….js"`. All app code already loads PDFs on-click only; the chunking config is the sole cause.

2. **Four font families are render-blocking.** The head loads Inter, Playfair Display, Geist and Plus Jakarta Sans from Google Fonts via a blocking stylesheet. The landing page's largest element is an H1 (text), so it cannot paint until fonts resolve.

3. **The landing page waits for the login check before rendering anything.** `Index.tsx` shows a full-screen "Loading…" splash until auth resolves. Inside the Lovable preview iframe the session lookup goes through a postMessage broker that can take up to ~4 seconds before timing out, so in the preview specifically visitors stare at a blank/loading screen. A public marketing page should never wait on auth.

## The fix

**1. Stop shipping the PDF engine on first load**
- Remove the `vendor-pdf` manual chunk from `vite.config.ts` so Rollup keeps `@react-pdf/renderer` inside the dynamic-import graph where the code already puts it.
- Re-check the built entry chunk after the change to confirm no `vendor-pdf` import remains and that first-load weight drops to roughly 400 KB.
- Audit the remaining manual chunks (`vendor-radix`, `vendor-motion`, `vendor-icons`, `vendor-datefns`) for the same stranded-helper trap and drop any that leak into the entry.

**2. Trim and de-block fonts**
- Drop unused families (keep Inter + Playfair Display; remove Geist and Plus Jakarta Sans unless they are actually referenced) and narrow weights to those in use.
- Load the Google Fonts stylesheet non-blocking (`media="print"` + `onload` swap, with a `<noscript>` fallback) and preload the two primary WOFF2 files so the H1 paints immediately.

**3. Render the landing page instantly**
- In `Index.tsx`, render the marketing page straight away instead of gating on `loading`/`authReady`; only redirect to `/dashboard` once auth has resolved and a user exists. No splash screen for anonymous visitors.

**4. Fix the console-error flood found during QA**
- Every page load logs dozens of React "Function components cannot be given refs" errors originating at the app root (`react-helmet-async` v3 with React 18). Confirm the source, then either pin a compatible version or wrap the offending provider so the console is clean.

**5. Verification**
- Re-run the browser measurement on the landing page: report before/after for first paint, settle time, request count and total KB.
- Re-run it under simulated slow 4G to confirm the real-world improvement.
- Walk the landing page visually at 390px and 1280px to confirm nothing regressed from the font change.

## Not in this pass

The wider end-to-end QA sweep across the signed-in screens (Dashboard, Orders, Stock, My Business, Billing, etc.) is still worth doing — say the word and I will run it as a follow-up once the landing page is fast.

## Technical notes

- Files touched: `vite.config.ts`, `index.html`, `src/pages/Index.tsx`, and possibly `package.json` (helmet version).
- No backend, database, or business-logic changes.
- The published site only picks these up after a publish; the preview updates immediately.
