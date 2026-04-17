
## Fix: preview showing an old build

### Likely root cause
The preview is still running PWA update logic even though `main.tsx` tries to disable service workers in preview/iframe mode.

What I found:
- `src/main.tsx` unregisters existing service workers on preview hosts / iframes.
- But `src/App.tsx` still mounts `UpdatePrompt` unconditionally.
- `src/components/UpdatePrompt.tsx` always calls `registerSW(...)`, which can re-register the service worker right after `main.tsx` unregisters it.

So the preview can get stuck on a stale cached build even after hard refresh. This matches what you’re seeing.

### Implementation plan
1. **Stop all PWA/service-worker registration in preview**
   - Add the same preview/iframe guard used in `main.tsx` to `UpdatePrompt.tsx`.
   - If running inside Lovable preview or any iframe, return early and do not call `registerSW`, polling, or update checks.

2. **Make the guard consistent**
   - Move the preview-environment detection into one shared helper so `main.tsx` and `UpdatePrompt.tsx` use the exact same logic.
   - This avoids future mismatches where one file disables SW and another re-enables it.

3. **Aggressively clean stale preview caches**
   - In preview/iframe mode, keep the existing unregister behavior and expand it to clear app caches as well.
   - This helps remove already-cached old assets from previous registrations.

4. **Optionally gate the component at the app level**
   - In `App.tsx`, only mount `UpdatePrompt` outside preview mode.
   - This gives an extra layer of protection even if someone later edits `UpdatePrompt`.

### Files to update
- `src/main.tsx`
- `src/components/UpdatePrompt.tsx`
- Possibly `src/App.tsx`
- Optionally a tiny shared env helper in `src/lib` or `src/utils`

### Why this should fix it
- Preview should never behave like an installed PWA.
- Disabling SW registration in preview removes the main source of stale builds.
- Clearing old caches ensures users stop seeing outdated JS/HTML bundles.

### Out of scope
- No changes to the published app’s normal update flow
- No changes to install behavior on the real production domain
- No routing or business-logic changes

### Technical note
This looks like a preview-only caching regression caused by:
```text
main.tsx: unregister old SW in preview
App.tsx: mounts UpdatePrompt anyway
UpdatePrompt.tsx: immediately registers SW again
```
So the fix is not “clear browser cache harder” — it’s to stop preview from participating in the PWA lifecycle at all.
