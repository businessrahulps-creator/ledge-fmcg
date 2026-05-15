# PR 2 — Logo, favicon, PWA icons (Ledge V2 brand)

Use the two uploaded assets verbatim. No regeneration, no AI imagery — these are your final brand files.

## Source files
- `user-uploads://Ledge_Logo_New.png` → full lockup (square mark + "Ledge" wordmark)
- `user-uploads://Ledge_Icon.png` → square mark only

## What I'll do

**1. Drop the new assets**
- `src/assets/ledge-logo.webp` → replaced by new `Ledge_Logo_New.png` (kept as `.png`, references updated)
- `src/assets/ledge-mark.png` → replaced by `Ledge_Icon.png`
- `src/assets/ledge-app-icon.png` → replaced by `Ledge_Icon.png` (used in InstallPrompt + Settings)
- Generate downscaled PNGs via ImageMagick from the icon for `public/`:
  - `public/favicon.png` (32×32)
  - `public/favicon.ico` (deleted — old colorful checkmark; favicon.png supersedes)
  - `public/pwa-192.png` (192×192, padded to safe zone, Bone background)
  - `public/pwa-512.png` (512×512, same)
  - `public/pwa-maskable-512.png` (512×512 with extra Bone padding for Android safe-zone mask)
- `public/apple-touch-icon.png` (180×180, Bone background) — new file, referenced in `index.html`

**2. Update references**
- `src/components/layout/AppSidebar.tsx` — swap import to new logo + mark
- `src/components/landing/sections/Navbar.tsx` and `MobileMenuOverlay.tsx` — swap to new logo
- `src/components/InstallPrompt.tsx` and `src/pages/Settings.tsx` — swap to new app icon
- `index.html` — bump cache-bust query (`?v=3`), add apple-touch-icon link, update `theme-color` from `#3b82f6` → Midnight `#0F1F3A`
- `src/components/SplashScreen.tsx` — switch halo background from purple/coral gradient to Bone with soft Terracotta glow, use new mark

**3. Memory**
- Update `mem://style/branding-assets` with the new logo description and exact asset paths.

## What I will NOT touch
- The logo SVG mark inside the wordmark file is preserved as a raster — no vectorization or color change. The asset goes in pixel-perfect.
- Landing page styling (only the logo *image source* swaps; layout untouched per the broader landing-rebrand plan).
- No service worker / vite-plugin-pwa changes — manifest is already absent, just static icons.

## Technical details
- ImageMagick via `nix run nixpkgs#imagemagick`. Source icon is square, ~310×310. We'll upscale to 512 with Lanczos for the PWA sizes (acceptable since the artwork is geometric stripes, not photographic).
- For maskable: add ~12% Bone (#F5EFE6) padding so the icon survives Android's circular/squircle masks.
- Apple-touch-icon uses Bone background (no transparency) per iOS guidelines.
- `theme-color` meta drives the PWA status-bar color and Chrome address bar tint — Midnight matches the new brand.

Estimated time: ~10 minutes. No tests touched, no logic changed. Pure asset + reference swap.