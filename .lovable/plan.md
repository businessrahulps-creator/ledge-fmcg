

# Add Unsaved Changes Guard to New Order Page

## Problem

The NewOrder form has ~10 state fields and line items. If a user accidentally taps "Back" or navigates away mid-entry, all data is silently lost.

## Solution

Add two guards:

1. **Browser `beforeunload`** — catches tab close, refresh, URL bar navigation
2. **React Router blocker** — catches in-app navigation (back button, sidebar links)

Both only activate when the form has meaningful data (dealer selected OR any line has a product chosen).

## Implementation

**`src/pages/NewOrder.tsx`** — ~25 lines added:

1. Add a `isDirty` derived boolean:
   ```ts
   const isDirty = selectedDealer !== "" || lines.some(l => l.productId !== "");
   ```

2. Add `beforeunload` effect:
   ```ts
   useEffect(() => {
     const handler = (e: BeforeUnloadEvent) => { if (isDirty) e.preventDefault(); };
     window.addEventListener("beforeunload", handler);
     return () => window.removeEventListener("beforeunload", handler);
   }, [isDirty]);
   ```

3. Use React Router's `useBlocker` for in-app navigation:
   ```ts
   import { useBlocker } from "react-router-dom";
   const blocker = useBlocker(({ currentLocation, nextLocation }) =>
     isDirty && currentLocation.pathname !== nextLocation.pathname
   );
   ```

4. Add an `AlertDialog` (already imported) that shows when `blocker.state === "blocked"`:
   - Title: "Discard unsaved order?"
   - Description: "You have unsaved changes. Leaving will lose your progress."
   - Cancel → `blocker.reset()`, Discard → `blocker.proceed()`

5. Clear dirty state on successful save (already navigates away via `navigate`).

**1 file modified. No new files. No new dependencies. No database changes.**

