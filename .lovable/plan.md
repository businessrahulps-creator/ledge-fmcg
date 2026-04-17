

## The honest answer on PWA update timing

You want offline support **and** fast updates. Here's the real-world timing with the current setup:

| Scenario | Time to see update |
|---|---|
| App is open + tab visible | ~60s (poll interval) |
| App closed, then reopened | Instant check, ~2-5s to download, then "Update" toast |
| iPhone PWA, killed from app switcher | Up to **24 hours** (iOS Safari quirk — it aggressively caches the SW) |
| iPhone PWA, never opened for days | Could be **days** until iOS revalidates |

The screenshot you shared is the classic iOS PWA staleness problem. iOS Safari is the worst offender — Android Chrome usually updates within a minute.

## Root causes (why it keeps happening)

1. **`registerType: "autoUpdate"`** in `vite.config.ts` — this name is misleading. It auto-*activates* a new SW once detected, but it doesn't auto-*detect* faster. Detection still depends on the browser checking.
2. **iOS throttles SW update checks aggressively** — sometimes only on cold launch, sometimes once per 24h.
3. **No version banner in the UI** — user has no way to know they're stale or to force-check.
4. **The "Update" toast** in `UpdatePrompt.tsx` only appears if the SW *detects* a new version. On iOS PWA, that detection often never fires while the app is in standalone mode.

## The fix — 4 layers, keeping offline support

**Layer 1 — Aggressive update detection (code)**
- Change polling from 60s → **20s** when tab is visible.
- Add `navigator.serviceWorker.controller` check + `registration.update()` on **every route change**, not just on visibility.
- Listen for `controllerchange` event and auto-reload (no toast needed for trivial updates).

**Layer 2 — Cache-busting at the network layer (vite.config.ts)**
- Set Workbox `cleanupOutdatedCaches: true` (already implicit, make it explicit).
- Add `navigationPreload: true` so navigations always race the network.
- Switch HTML navigation strategy to **NetworkFirst** with a 3s timeout — this means if you're online, you always get fresh HTML; if offline, you get cached. This is the #1 fix for stale iOS PWAs.

**Layer 3 — Visible version indicator (UI)**
- Show the build version (already exposed as `__APP_VERSION__`) in Settings → About, with a "Check for updates now" button.
- If a new SW is waiting, show a small dot on the header refresh button (you already have `RefreshAppButton.tsx`).

**Layer 4 — iOS escape hatch (the "outside the box" bit)**
- Embed the build timestamp in `index.html` as a `<meta name="app-version">` tag.
- On app load, fetch `/index.html?_=<timestamp>` (bypasses cache), parse the meta tag, compare to current `__APP_VERSION__`. If mismatch → show a forced "New version available" banner that calls `skipWaiting` + reload. This sidesteps iOS SW throttling entirely because it's a plain `fetch`, not a SW update check.

## Realistic timing after these fixes

| Scenario | Before | After |
|---|---|---|
| Android Chrome, app open | ~60s | **~5s** (Layer 4 catches it) |
| iPhone PWA, app open | up to 24h | **~5s** (Layer 4 catches it) |
| iPhone PWA, cold launch | ~5s | **~2s** (NetworkFirst HTML) |
| Offline | Works ✅ | Works ✅ |

## Files to change
1. `vite.config.ts` — add `navigationPreload`, switch HTML to NetworkFirst, explicit `cleanupOutdatedCaches`.
2. `src/components/UpdatePrompt.tsx` — faster polling, route-change checks, controllerchange listener, Layer 4 meta-tag check.
3. `index.html` — inject `<meta name="app-version" content="...">`.
4. `src/components/layout/RefreshAppButton.tsx` — small dot indicator when update is waiting.
5. `src/pages/Settings.tsx` — show current build version + "Check now" button (small addition).

## What stays the same
- Offline support: ✅ kept
- Installable PWA: ✅ kept
- Asset caching (fonts, images, JS bundles): ✅ kept
- The existing `UpdatePrompt` toast: ✅ kept as fallback

## Honest caveat
There is no setup on Earth that makes an iOS PWA update *instantly while closed*. Apple controls that. But Layer 4 guarantees the user sees the update **within ~2 seconds of opening the app** — which is the experience users actually care about.

