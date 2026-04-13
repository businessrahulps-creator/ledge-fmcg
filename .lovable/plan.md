

# Fix: All Pages Frozen / Not Scrollable

## Root Cause

The outer layout container uses `min-h-screen` instead of `h-screen`. With `min-h-screen`, the flex container grows to fit all content — meaning `<main>`'s `overflow-y-auto` never activates because the element is never shorter than its content. Nothing scrolls.

## Fix

### `src/components/layout/AppLayout.tsx` — line 118

Change the outer wrapper from:
```
<div className="flex min-h-screen w-full overflow-x-hidden bg-background">
```
to:
```
<div className="flex h-dvh w-full overflow-hidden bg-background">
```

`h-dvh` (dynamic viewport height) is the correct unit for mobile — it accounts for Android Chrome's collapsing address bar and iOS Safari's safe areas. `overflow-hidden` on the outer container ensures only `<main>` scrolls.

### `src/components/layout/AppLayout.tsx` — line 123

Ensure the inner column also constrains height:
```
<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
```

Changed `overflow-x-hidden` to `overflow-hidden` so the column doesn't grow beyond bounds.

No other files need changes. The CSS in `index.css` is fine as-is.

## Files Changed
- `src/components/layout/AppLayout.tsx` — two class changes on container divs

