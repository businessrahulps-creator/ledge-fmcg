

# Lazy-Load Performance Page to Code-Split Recharts

## Problem
All pages are eagerly imported in `App.tsx`. The Performance page pulls in Recharts (~45KB gzipped), which gets bundled into the initial load for every user — even those who never visit it.

## Solution
Use `React.lazy()` + `Suspense` to code-split the Performance page. Vite/Rollup will automatically put Recharts into a separate chunk that only loads when the user navigates to `/performance`.

## Changes

### `src/App.tsx`
- Replace `import Performance from "./pages/Performance"` with `const Performance = React.lazy(() => import("./pages/Performance"))`
- Wrap the Performance route element in `<Suspense fallback={<PageSkeleton />}>` (reusing the existing skeleton component)
- Apply the same lazy pattern to other heavy/infrequent pages: `Reports`, `Billing`, `Settings`, `Help`, and all legal pages (`PrivacyPolicy`, `TermsOfService`, `RefundPolicy`, `AboutUs`, `Contact`)

### `vite.config.ts`
- Remove the manual `react-pdf` chunk from `manualChunks` — lazy loading handles code-splitting naturally and the manual chunk can cause duplicate-module issues

## Impact
- Initial bundle shrinks by ~45KB+ gzipped
- Performance page loads its chunk on first visit (typically <1s on 4G)
- Users see a skeleton briefly while the chunk loads
- Zero functional changes

