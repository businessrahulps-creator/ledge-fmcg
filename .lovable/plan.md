

# ISSUE 1 — Force-update notice for every user (web + PWA)

## Current state (verified)
- `vite.config.ts` already registers a service worker via `vite-plugin-pwa` with `registerType: "autoUpdate"`, `skipWaiting: true`, `clientsClaim: true`.
- `src/components/UpdatePrompt.tsx` exists but is silently auto-reloading on `onNeedRefresh` — user never sees a notice, and on the landing page the SW is unregistered (per `main.tsx` guard for preview/iframe), so the prompt only runs on the published domain.
- No manual "Refresh app" affordance anywhere.
- The landing `Index.tsx` doesn't render `UpdatePrompt` (it's mounted inside `App.tsx`'s authed layout area — need to verify, but that's the symptom).

## Fix — small, surgical changes

### 1. Rewrite `src/components/UpdatePrompt.tsx`
- On `onNeedRefresh`, **show a sonner toast** (sticky, no auto-dismiss) with title "New version of Ledge is ready" and an **"Update"** action button.
- Clicking Update calls `updateSW(true)` → SW activates → page reloads → success toast on next load (existing `UPDATED_KEY` flow kept).
- Keep the 60s polling for `registration.update()`.
- Add a "Later" dismiss action that re-shows the toast every 5 min until updated.
- Expose a global `window.__ledgeTriggerUpdate()` so the header link can call it.

### 2. Mount `UpdatePrompt` globally in `src/App.tsx`
- Currently likely inside the authed layout. Move it to the top level so it runs on `/` (landing), `/login`, `/dashboard` — every route. Will verify exact mount point during implementation.

### 3. Add "Refresh app" link in header
- File: `src/components/layout/AppLayout.tsx` (next to the notification bell).
- Small ghost button with `RefreshCw` icon + tooltip "Check for updates". On click: calls `navigator.serviceWorker.getRegistration().then(r => r?.update())` then if an update is waiting, triggers `window.__ledgeTriggerUpdate()`; otherwise shows toast "You're on the latest version".

### 4. Landing page coverage
- Since `main.tsx` unregisters SW in iframes/preview hosts (correct, do not touch), the update notice only fires on production domains — which is exactly what we want. On the published landing page the SW IS registered and `UpdatePrompt` mounted globally will pick it up.
- Add a lightweight version-check fallback for the landing page (which may be cached aggressively by the SW): on mount, fetch `/index.html?ts=${Date.now()}` with `cache: 'no-store'`, parse out the main JS asset hash, compare to the currently loaded hash (read from `import.meta.url` of a known module or a build-time injected `__APP_VERSION__`). If different, show the same update toast. This catches users sitting on the landing tab for hours.
- Inject `__APP_VERSION__` via Vite `define` in `vite.config.ts` using build timestamp.

### 5. Toast styling
- Use existing sonner (already wired). `duration: Infinity`, `action: { label: "Update", onClick }`, `cancel: { label: "Later" }`.

## Files changed (4)
1. `src/components/UpdatePrompt.tsx` — rewrite with visible toast + global trigger
2. `src/App.tsx` — ensure `<UpdatePrompt />` mounted at root (above routes)
3. `src/components/layout/AppLayout.tsx` — add "Refresh app" icon button next to bell
4. `vite.config.ts` — add `define: { __APP_VERSION__: JSON.stringify(Date.now().toString()) }`

Plus a tiny `src/vite-env.d.ts` addition for the `__APP_VERSION__` global type.

## Out of scope
- No changes to ServiceWorker config strategy (already correct).
- No changes to iframe/preview guard in `main.tsx`.
- ISSUE 2 will be handled in a separate plan after you confirm ISSUE 1.

