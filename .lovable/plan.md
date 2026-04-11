

# Fix Bug #19: Per-Page Error Boundaries

## Problem
A crash in any page component (e.g. Dashboard, Orders) takes down the entire app including navigation and sidebar.

## Changes

### 1. Create `src/components/PageErrorBoundary.tsx`
A class component similar to the existing `ErrorBoundary` but with a page-scoped fallback that preserves the surrounding layout (sidebar/header). Shows a centered card with an error message and "Reload Page" button. Logs errors to console with `"PageErrorBoundary caught:"` prefix.

### 2. Edit `src/App.tsx` — Wrap 8 protected routes
Import `PageErrorBoundary` and wrap each page component inside `ProtectedRoute`:

```
<ProtectedRoute><PageErrorBoundary><Dashboard /></PageErrorBoundary></ProtectedRoute>
```

Applied to: Dashboard, Orders, NewOrder, Distributors, Stock, Salespersons, Reports, Settings.

The top-level `ErrorBoundary` remains for catastrophic failures. Public routes (login, signup, landing, legal pages) are not wrapped since they're simple and low-risk.

## Scope
- New file: `src/components/PageErrorBoundary.tsx`
- Modified: `src/App.tsx` (import + 8 route wraps)
- No other files touched

