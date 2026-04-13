

# Fix: Pages Not Scrollable on Mobile and Web

## Root Cause
The CSS rule `overflow-x: hidden` applied to `html, body, #root` is causing scroll issues. On mobile browsers (especially Android Chrome), applying `overflow-x: hidden` to `html` or `body` can implicitly change the overflow model and create conflicting scroll containers. Combined with `overscroll-behavior-y: contain` on all three elements, the browser gets confused about which element should scroll.

## Fix

### `src/index.css` — Remove problematic overflow rules from html/body

Change the current rule:
```css
html, body, #root {
  overflow-x: hidden;
  overscroll-behavior-y: contain;
}
```

To only apply `overflow-x: hidden` on `#root` (not `html` or `body`), and move `overscroll-behavior-y: contain` to just `body`:

```css
body {
  overscroll-behavior-y: contain;
}

#root {
  overflow-x: hidden;
}
```

This preserves the horizontal overflow prevention and pull-to-refresh suppression while restoring normal vertical scrolling on all browsers.

### `src/components/layout/AppLayout.tsx` — Ensure main is scrollable

The `<main>` element already has `overflow-y-auto` which is correct. No changes needed here — the CSS fix alone should resolve this.

## Files Changed
- `src/index.css` — restructure overflow/overscroll rules to not block vertical scrolling

