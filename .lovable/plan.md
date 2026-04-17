
## Fix: preview keeps reverting to an old build

### What I found
The project already has preview guards in:
- `src/main.tsx`
- `src/App.tsx`
- `src/components/UpdatePrompt.tsx`

But the shared detector in `src/lib/preview-env.ts` is incomplete:

```ts
h.includes("id-preview--") || h.includes("lovableproject.com")
```

Your actual preview URL is on `...lovable.app`, not `lovableproject.com`.

That means:
- inside the editor iframe, preview is blocked only because `isInIframe` is true
- but in any standalone/opened preview tab on the preview origin, the app is treated like production
- PWA/service-worker logic can still register on the preview origin there
- once that happens, the preview origin can keep serving stale cached assets and appear to jump between new and old builds

So the issue is not your browser cache anymore; it is stale preview-origin PWA state.

### Implementation plan

1. **Fix preview detection**
   - Update `src/lib/preview-env.ts` so preview-host detection matches the real preview domain pattern (`id-preview--*.lovable.app`) instead of the outdated `lovableproject.com` check.
   - Keep iframe detection too.

2. **Apply the fixed guard consistently**
   - Reuse that helper everywhere preview should behave differently:
     - `src/main.tsx`
     - `src/components/UpdatePrompt.tsx`
     - `src/App.tsx`
     - `src/hooks/use-install-prompt.ts`

3. **Make preview cleanup stronger**
   - In `src/main.tsx`, when `isPreviewEnv` is true:
     - unregister all service workers
     - clear all Cache Storage entries
     - reset any global update flags used by `UpdatePrompt`
   - This ensures a previously registered preview service worker cannot keep taking control.

4. **Disable all PWA/update behavior in preview**
   - Keep `UpdatePrompt` completely inert in preview.
   - Also disable install-prompt behavior in preview so the preview never acts like an installable app.

5. **Add one more safeguard for stale preview state**
   - In preview mode, force-remove any manifest/installability hints that could encourage browser PWA behavior on the preview origin.
   - This is optional but recommended as a belt-and-suspenders fix.

### Why this should solve the “new build for a minute, then old build again” behavior
Because the bug is likely not the current iframe session alone. It is that the preview origin was allowed to behave like a real PWA at some point, and that old service worker/cache keeps reclaiming control. Correct host detection plus aggressive cleanup stops that loop.

### Files to update
- `src/lib/preview-env.ts`
- `src/main.tsx`
- `src/components/UpdatePrompt.tsx`
- `src/App.tsx`
- `src/hooks/use-install-prompt.ts`

### Verification after implementation
- Open the preview and confirm the current build ID/version matches the latest code.
- Reload multiple times and wait a minute to confirm it does not revert.
- Open the preview in a separate tab and confirm it still shows the same latest build.
- Confirm the published app still keeps normal update/install behavior.

### Out of scope
- No business-logic changes
- No routing changes
- No published-app redesign
- No backend changes
