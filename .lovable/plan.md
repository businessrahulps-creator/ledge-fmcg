

# Fix: Stale Service Worker Serving Old App Version

## Problem
Customer on getledge.in sees an old version even after login/logout. Only incognito or full browser restart fixes it. This is because `registerType: "prompt"` makes the new service worker **wait** until all tabs close before activating.

## Solution (2 files, ~5 lines changed)

### 1. `vite.config.ts` — Force immediate SW activation
- Change `registerType` from `"prompt"` to `"autoUpdate"`
- Add `skipWaiting: true` and `clientsClaim: true` to workbox config
- This makes new service workers activate immediately on detection, replacing stale caches

### 2. `src/components/UpdatePrompt.tsx` — Adapt to autoUpdate
- Change `registerSW` usage to match `autoUpdate` behavior
- The prompt still shows briefly to inform users, then auto-reloads
- Keep the 60-second poll for faster update detection

### What Changes for Users
- **Before**: New version sits in "waiting" state → user must click "Reload" or close all tabs
- **After**: New version activates automatically → page refreshes to load latest code
- No more stale cache scenarios

### No Risk
- `skipWaiting` + `clientsClaim` is the standard pattern used by Google's own PWA guidance
- Existing cached data (localStorage, IndexedDB) is unaffected
- Only static asset cache (JS/CSS/HTML) gets refreshed

