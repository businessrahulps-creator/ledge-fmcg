

# Fix: "Something went wrong" on New Order page

## Root Cause

`useBlocker` from `react-router-dom` requires a **data router** (`createBrowserRouter`), but the app uses `<BrowserRouter>` which is not a data router. This crashes the entire `NewOrder` component on mount.

This was likely introduced during a recent edit to add unsaved-changes protection.

## Fix

Remove `useBlocker` and replace it with a simple `window.confirm` prompt via the existing `beforeunload` handler pattern + a custom navigation guard using `useNavigate`. Specifically:

1. **Remove** `useBlocker` import and usage (lines 2, 115-117)
2. **Remove** any blocker confirmation UI (if any dialog references `blocker.state`)
3. The existing `beforeunload` handler (lines 108-113) already covers browser close/refresh — keep that
4. No other changes needed; the `beforeunload` handler is sufficient for unsaved-changes protection without requiring a data router

## Files Changed
- `src/pages/NewOrder.tsx` — remove `useBlocker` import and usage, remove any blocker-related UI

