

# Add Pull-to-Refresh to Dashboard and Orders Pages

## Change

Replicate the existing pull-to-refresh pattern (from Performance/Schemes) onto Dashboard and Orders pages. Same hook, same spinner UI, same refresh logic.

## Implementation

### `src/pages/Dashboard.tsx`

1. Import `usePullToRefresh` and `useCallback`
2. Add `handleRefresh` callback (same pattern: call `api.refreshAll` or fake delay)
3. Destructure `containerRef`, `pullDistance`, `refreshing` from hook
4. Wrap the main content `<div>` with `ref={containerRef}` and add `relative overflow-y-auto` classes
5. Insert the pull indicator `<div>` (spinning loader circle) at the top of the container, before `<SetupChecklist />`

### `src/pages/Orders.tsx`

1. Import `usePullToRefresh` and `useCallback`
2. Add `handleRefresh` callback
3. Destructure hook values
4. Wrap the main content `<div>` with `ref={containerRef}` and add `relative overflow-y-auto`
5. Insert the same pull indicator at the top of the container

### Pull indicator markup (identical across all pages)

```tsx
<div
  className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
  style={{ height: pullDistance > 0 || refreshing ? `${Math.max(pullDistance, refreshing ? 48 : 0)}px` : "0px" }}
>
  <div
    className={`h-6 w-6 rounded-full border-2 border-primary border-t-transparent ${refreshing ? "animate-spin" : ""}`}
    style={{ opacity: Math.min(pullDistance / 80, 1), transform: `rotate(${pullDistance * 3}deg)` }}
  />
</div>
```

**2 files modified. No new files. No new dependencies. No database changes.**

