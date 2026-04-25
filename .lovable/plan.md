# Replace sidebar wordmark with Ledge logo

## Goal
Swap the CSS gradient `<span>Ledge</span>` in `AppSidebar.tsx` for the official Ledge logo asset, in both expanded and collapsed sidebar states.

## Approach

### 1. Add logo assets to `src/assets/`
- Copy `user-uploads://Ledge_Logo.png` → `src/assets/ledge-logo.png` (full horizontal lockup: gradient L mark + "Ledge" wordmark).
- Crop the gradient L mark only → `src/assets/ledge-mark.png` for the collapsed sidebar state.
  - Use ImageMagick (`nix run nixpkgs#imagemagick`) to crop the left portion of the source and trim whitespace.

### 2. Update `src/components/layout/AppSidebar.tsx`
Replace the current header block (lines ~115–124):

- **Expanded:** `<img src={ledgeLogo} alt="Ledge" className="h-7 w-auto" />`
- **Collapsed:** `<img src={ledgeMark} alt="Ledge" className="h-7 w-7 object-contain" />` — replaces the current "L" placeholder chip styled with `bg-primary/10`.

Imports:
```ts
import ledgeLogo from "@/assets/ledge-logo.png";
import ledgeMark from "@/assets/ledge-mark.png";
```

Remove `brand-gradient-text` from the header — the gradient now lives inside the logo asset, avoiding a double-gradient.

### 3. Update memory
- `mem://style/brand-moments.md` — change item #4 to: "AppSidebar — gradient L mark inside the Ledge logo lockup" (the image carries the gradient now, not CSS text). The 4-surface rationing rule still holds.
- `mem://style/aesthetic` — note the in-app shell now uses an image lockup (with gradient L glyph), not a pure CSS wordmark. Landing page is unchanged.

## Out of scope
- Landing page navbar (user said "not landing page" for brand changes).
- Splash screen, favicon, PDF headers — not requested.

## Verification
- Visual check: expanded sidebar shows the full lockup; collapsed shows just the gradient L mark.
- `tsc` passes; no test changes needed.