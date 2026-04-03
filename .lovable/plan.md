

# Set Custom PWA App Icon

## Overview
Replace the existing PWA icons with the uploaded image (the colorful checkmark icon) so it appears as the app icon when users install Ledge from their browser.

## Steps

### 1. Copy uploaded image to public directory
Copy the uploaded icon to the project and generate the three required PWA icon sizes:
- `public/pwa-192.png` (192x192)
- `public/pwa-512.png` (512x512)
- `public/pwa-maskable-512.png` (512x512, same image — it already has padding suitable for maskable use)

### 2. Set as favicon
Also update `public/favicon.ico` and add a PNG favicon reference in `index.html` so the browser tab icon matches.

### 3. Update InstallPrompt icon
In `src/components/InstallPrompt.tsx`, replace the "L" text logo in the install prompt with the actual app icon image for a polished look.

## Technical Details
- Use ImageMagick (`nix run nixpkgs#imagemagick`) to resize the uploaded PNG to 192x192 and 512x512
- The uploaded image has a transparent background and rounded corners — it's already well-suited for PWA icons
- No changes to `vite.config.ts` needed; icon filenames remain the same

## Files Modified
- `public/pwa-192.png` — replaced
- `public/pwa-512.png` — replaced
- `public/pwa-maskable-512.png` — replaced
- `public/favicon.ico` — replaced
- `index.html` — add PNG favicon link
- `src/components/InstallPrompt.tsx` — use icon image instead of "L" text

