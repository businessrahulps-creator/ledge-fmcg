

# Fix: "Reload" Button Does Nothing

## Root Cause

`main.tsx` unregisters all service workers in preview/iframe environments, but `UpdatePrompt` still registers via `virtual:pwa-register` and shows the "A new version is available" banner. When clicked, `updateSW?.(true)` tries to activate a SW that was already unregistered — so nothing happens.

## Fix

Update `handleReload` in `src/components/UpdatePrompt.tsx` to fall back to `window.location.reload()`:

```typescript
const handleReload = useCallback(() => {
  if (updateSW) {
    updateSW(true).catch(() => window.location.reload());
  } else {
    window.location.reload();
  }
}, [updateSW]);
```

This ensures clicking "Reload" always works — either via SW update or a hard page reload as fallback.

## Files Changed
- `src/components/UpdatePrompt.tsx` — add `window.location.reload()` fallback in `handleReload`

