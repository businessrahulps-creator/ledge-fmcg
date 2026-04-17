

# Add subtle "syncing…" indicator in header

## Plan
Show a small, unobtrusive indicator in the `AppLayout` header when `isRefreshing` is true (background fetch after cache-first paint).

### Changes — 1 file
**`src/components/layout/AppLayout.tsx`**
- Import `useData` from `@/context/DataContext`.
- Read `isRefreshing` from the context.
- Render a small inline element to the left of `LiveClock` (in the existing `ml-auto` cluster):
  - Tiny spinning `Loader2` icon (h-3 w-3) + "Syncing…" text in `text-[11px] text-muted-foreground`.
  - Hidden on very small screens (`hidden sm:inline-flex`) to avoid crowding mobile header.
  - Wrapped in `AnimatePresence` + `motion.div` with fade/slide for smooth appear/disappear (matches existing offline banner pattern).
  - Only renders when `isRefreshing && online` (avoid double-signaling alongside the offline banner).

### Out of scope
- No new files, no context changes (`isRefreshing` already exposed from ISSUE 2).
- No changes to the offline/syncing banner below the header (different semantic — that's for queued offline mutations).

