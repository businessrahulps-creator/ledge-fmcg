# Fix the broken opening screens on phones

Two different failures, same root cause family: a phone (especially an installed home-screen app) is holding an old copy of the app's opening page, and the files that page points to no longer exist on the server.

- Screenshot 1 ("files are temporarily unavailable") — the phone asked for a file that is gone, and the hosting fallback page appeared instead of Ledge.
- Screenshot 2 (Ledge loads but everything is unstyled, plain text on navy) — the page itself opened, but its styling file failed to load, so the app rendered raw.

There is already recovery code in the project for exactly this, but it was never connected to anything, so it never runs.

## What will change

1. **Turn on the existing self-repair.** Connect the recovery routine to the app's error handling and to global page errors, so a failed screen file automatically clears the old stored copies and reloads once. A one-time guard prevents any reload loop.

2. **Detect the unstyled case.** Right after start-up, check whether the app's styling actually applied (test a known style value). If it did not, run the same self-repair: clear stored copies, then reload once with a fresh request so the phone cannot serve the stale page again.

3. **Force a genuinely fresh page on recovery.** The reload will bypass the phone's stored copy instead of a plain reload, so the repaired load actually fetches the current files.

4. **Catch failed file loads directly.** Listen for styling/script files that fail to load and treat that as the same recoverable condition, rather than silently rendering a broken page.

5. **Honest fallback message.** If self-repair has already run once and the app still cannot load its files, show a plain Ledge screen saying the app could not load and offering a Retry button — instead of the grey heart page or a raw unstyled screen.

6. **Keep the clean-up worker shipped.** The kill-switch that removes the old offline cache stays in place for at least another release, so phones that have not opened the app recently still self-clean.

## Not changing

No business logic, pricing, GST, orders, permissions, or screen layouts. Offline mode stays paused. The opening animation stays as it is.

## Technical notes

- Wire `src/lib/chunk-recovery.ts` into `src/components/ErrorBoundary.tsx` and `src/components/PageErrorBoundary.tsx` (`getDerivedStateFromError` / `componentDidCatch` → `isChunkLoadError` → `recoverFromChunkError`), plus the existing `window.onerror` / `unhandledrejection` handlers in `src/main.tsx`.
- Add a stylesheet sentinel in `src/main.tsx`: read a CSS custom property defined in `src/index.css` (e.g. `--background`) off `document.documentElement` after first paint; empty value ⇒ stylesheet missing ⇒ `recoverFromChunkError()`.
- Add a capture-phase `error` listener for `link[rel=stylesheet]` / `script` resource failures.
- In `recoverFromChunkError`, after unregistering workers and deleting caches, reload via a cache-busted URL (`?_r=<ts>`) rather than `location.reload()`.
- After a successful render, call `clearChunkReloadFlag()` so the guard resets.
- Second-failure fallback rendered with inline styles only (no dependence on the stylesheet), reusing the splash markup style in `index.html`.
- Verify with Playwright at 393×800: simulate a missing stylesheet and a failed dynamic import, confirm exactly one recovery reload and the fallback on the second failure.
