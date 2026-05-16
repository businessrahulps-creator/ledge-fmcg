
## Goal

Stop offline mode from hurting real devices **right now**, without deleting any of the offline-mode code we've built. In ~2 months we flip one flag and it's back.

There are two separate things tangled together under "offline mode":

1. **Service Worker / PWA caching** (`vite-plugin-pwa` → emits `sw.js`)
   This is what actually causes the stale-render / "takes time to load" pain on installed devices. Once an SW is registered, it keeps serving the old shell until it's explicitly unregistered.

2. **Offline data layer** (`src/lib/offline-store.ts` + queue replay + `useOnlineStatus` toasts)
   Wired into `DataContext`, every domain hook (`useOrdersDomain`, `useDealersDomain`, …), `Settings` page (pending queue UI), and `AppLayout` (sync banner). Cached reads + queued writes when offline.

We disable both, but **keep all source files**.

---

## Approach — feature flag + kill-switch

### A. Kill the Service Worker (the real fix for stale devices)

1. **Remove `VitePWA(...)` plugin** from `vite.config.ts` so new builds stop emitting a caching SW. Leave the import commented with a `// re-enable: see plan` note.
2. **Ship a kill-switch `public/sw.js`** at the exact same path the old SW lived. On install it claims clients, deletes every cache, navigates open windows once, then `unregister()`s itself. Devices that already installed the PWA will silently clean themselves on next visit.
3. **Keep a static `public/manifest.json`** (same icons, `display: standalone`, `start_url: /dashboard`) so "Add to Home Screen" still works — installability without a caching SW.
4. **Strip SW registration from the app**: delete the `registerSW(...)` call in `src/components/UpdatePrompt.tsx` (or short-circuit the file to render nothing). Remove `vite-plugin-pwa/client` from `vite-env.d.ts`. Drop `vite-plugin-pwa` from devDependencies (optional — can leave for easy revival).
5. Add `link rel="manifest"` directly in `index.html` (currently injected by the plugin).

### B. Neutralize the offline data layer (without ripping it out)

Add a single flag `OFFLINE_MODE_ENABLED = false` in `src/lib/offline-store.ts`. When `false`:

- `cacheData()` → no-op
- `getCachedData()` → returns `null` (callers already handle "no cache" by hitting the network)
- `enqueueMutation()` → throws / returns `{ queued: false }` so writes fail loudly instead of being silently queued
- `getQueue()` → returns `[]`
- `replaySingleMutation()` → no-op success

Plus two small UI tweaks (kept narrow so the rest of the code is untouched):

- **`AppLayout.tsx`** — hide the "sync pending" banner when flag is off.
- **`Settings.tsx`** — hide the "Pending offline changes" card when flag is off (or show a small "Offline mode is paused" note). All other Settings work stays intact.
- **`useOnlineStatus`** — keep the hook returning `navigator.onLine` but skip the flush + toast spam when flag is off.

Everything else (`DataContext`, domain hooks, tests, mocks) keeps importing from `offline-store` exactly as today — the functions just become no-ops. Zero refactor risk.

### C. Document the revival path

- Add a top-of-file comment in `offline-store.ts` and `vite.config.ts` pointing at `mem://features/offline-mode-paused` describing exactly what to flip.
- Save a memory file `mem://features/offline-mode-paused` with the 4-step revival recipe (un-comment VitePWA, delete kill-switch sw.js, flip flag to true, re-add `registerSW` in UpdatePrompt).

---

## Why not just delete it?

We considered three options:

| Option | Effort | Risk of losing work | Stale-device fix |
|---|---|---|---|
| Delete offline code + PWA | High | High | Yes |
| Feature flag + kill-switch SW *(picked)* | Low | None | Yes |
| Just unregister SW, leave offline layer running | Lowest | None | Yes, but offline queue keeps silently swallowing writes if a user goes offline → data loss risk |

The middle option gives us the device-side fix immediately and keeps the offline data layer dormant but visibly off (writes fail clearly when offline, instead of disappearing into a queue no one is watching).

---

## Files touched

**Edited (small)**
- `vite.config.ts` — remove `VitePWA(...)` from plugins array
- `src/main.tsx` — drop the preview-iframe SW unregister block (kill-switch handles it everywhere now) or keep as-is, harmless
- `src/components/UpdatePrompt.tsx` — return `null`, stop calling `registerSW`
- `src/vite-env.d.ts` — drop the `vite-plugin-pwa/client` reference
- `src/lib/offline-store.ts` — add `OFFLINE_MODE_ENABLED = false` flag + early returns
- `src/components/layout/AppLayout.tsx` — gate sync banner on flag
- `src/pages/Settings.tsx` — gate pending-queue card on flag
- `src/hooks/use-online-status.tsx` — skip flush + toasts when flag off
- `index.html` — add static `<link rel="manifest" href="/manifest.json">` + iOS meta tags

**Created**
- `public/sw.js` — kill-switch service worker
- `public/manifest.json` — static manifest (installability only)
- `mem://features/offline-mode-paused` — revival recipe

**Deleted**
- nothing

---

## What stays exactly as-is

- All `offline-store.ts` storage logic (IndexedDB schema, queue serialization, replay logic)
- All `cacheData`/`enqueueMutation` call sites across `DataContext` and domain hooks
- All tests under `src/context/domains/__tests__/*` — they mock `offline-store` anyway
- PWA icons under `public/`
- Pending-queue UI components in `Settings.tsx`

In ~2 months: flip `OFFLINE_MODE_ENABLED = true`, remove `public/sw.js` (and keep the kill-switch live for one release first), un-comment `VitePWA(...)`, restore `registerSW` in `UpdatePrompt.tsx`. ~15-minute job.

---

## Caveats

- **Installed PWAs on iOS keep `start_url` from install time** — devices that installed the old version will still launch the app, just without the caching SW. Cleanup is silent.
- **One release with the kill-switch is required** before deleting `public/sw.js` entirely; otherwise devices that haven't visited yet stay on the old cached shell forever.
- "Add to Home Screen" continues to work via the static manifest — no regression for users who want installability.
