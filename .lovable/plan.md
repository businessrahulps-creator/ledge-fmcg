
## Bug: "Something went wrong" on /orders/new

### Root cause
Console shows:
```
Error: useBlocker must be used within a data router.
  at useUnsavedChangesGuard (src/hooks/use-unsaved-changes-guard.ts:15)
  at NewOrder (src/pages/NewOrder.tsx:132)
```

`useBlocker` from react-router-dom v6 only works with a **data router** (`createBrowserRouter`). The app uses `<BrowserRouter>` (a non-data router), so calling `useBlocker` throws synchronously, crashing `NewOrder` and triggering the PageErrorBoundary.

This is a regression — likely the unsaved-changes guard was recently added to `NewOrder` (and possibly other forms) without the app being migrated to a data router.

### Fix (single-file, surgical)

**`src/hooks/use-unsaved-changes-guard.ts`** — replace the `useBlocker` based implementation with a router-agnostic one that:

1. Uses the standard `beforeunload` event for tab close / hard reload (works everywhere, no router required).
2. For in-app navigation, intercepts via a manual confirm using `window.confirm` triggered by patching `history.pushState`/`replaceState` listening, OR — simpler and safer — just keep the `beforeunload` guard and drop in-app blocking. Most users hit "Cancel"/back button which already triggers the page's own confirmation flow in `NewOrder`.

Recommended minimal approach: keep the hook's existing public API (`{ enabled }` arg, returns nothing or same shape), but internally only register a `beforeunload` listener when `enabled` is true. Remove the `useBlocker` call entirely. This eliminates the crash and still protects against accidental tab close/refresh, which is the primary risk.

### Why this works
- Removes the illegal `useBlocker` call → no more crash on `/orders/new`.
- Preserves data-loss protection for the most common destructive action (closing tab / reloading).
- No router migration needed (migrating to `createBrowserRouter` would touch `App.tsx` and every route — high risk for a hotfix).
- Zero changes to `NewOrder.tsx` or any caller.

### Out of scope
No router migration, no changes to `NewOrder.tsx`, no changes to other pages using the hook.
