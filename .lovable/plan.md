## Update app icon to new Ledge icon (purple/coral L)

The current favicon and PWA icons are stale. I'll replace all of them with the new icon you uploaded.

### Steps

1. **Copy** `user-uploads://Ledge_App_Icon.png` to `src/assets/ledge-app-icon.png` (source of truth, kept at full resolution).
2. **Generate sized PNGs** from the new icon using ImageMagick and write them to `public/`:
   - `public/favicon.png` — 256×256
   - `public/favicon.ico` — multi-size ICO (16, 32, 48)
   - `public/pwa-192.png` — 192×192
   - `public/pwa-512.png` — 512×512
   - `public/pwa-maskable-512.png` — 512×512 with safe-zone padding (icon scaled to ~80% on the dark background) so Android adaptive masks don't crop the L
3. **Bump cache-busters** in `index.html` for `apple-touch-icon` and `manifest` link (e.g. `?v=2`) so iOS / installed PWAs pick up the new icon instead of using the cached one.
4. **Verify** by listing the generated files and confirming sizes.

### Notes

- Manifest icon paths in `vite.config.ts` already point to `pwa-192.png` / `pwa-512.png` / `pwa-maskable-512.png` — no config change needed, just regenerate the files.
- iOS home-screen icons are aggressively cached; the `?v=2` query string forces a refresh. Users who already installed the PWA may need to remove and reinstall to see the new icon (this is an iOS limitation, not something we can fix in code).
- The new icon's dark background already matches the maskable safe-zone aesthetic, so padding will look natural.
