

# Fix: iOS Auto-Zoom on Input Focus

## Problem
On iOS Safari, when an input field has a font-size smaller than 16px, the browser automatically zooms in on focus. This breaks the "native app" feel — users see the page zoom and pan, making it feel like a website rather than an app.

The current Input and Textarea components use `text-sm` (14px), which triggers this iOS behavior.

## Fix

### `src/index.css`
Add a CSS rule targeting iOS to set all form inputs to 16px minimum font-size, preventing the auto-zoom while keeping the visual design intact:

```css
/* Prevent iOS Safari auto-zoom on input focus */
@supports (-webkit-touch-callout: none) {
  input, select, textarea {
    font-size: 16px !important;
  }
}
```

This uses `@supports (-webkit-touch-callout: none)` which only matches iOS Safari/WebKit, so desktop styling remains unaffected.

Additionally, add the `maximum-scale=1` attribute to the viewport meta tag in `index.html` as a secondary safeguard:

### `index.html`
Update the viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no" />
```

## Files Changed
- `src/index.css` — iOS-only 16px minimum on form inputs
- `index.html` — viewport meta to prevent pinch-zoom scaling

