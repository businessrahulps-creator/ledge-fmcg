# New App Icon Rollout

The uploaded image is the **iOS-style rounded-square app icon** (Ledge striped mark on a white rounded tile with padding). It replaces every surface where the OS / browser / install prompt shows a launcher icon. The bare `ledge-mark.webp` used inline next to the wordmark inside the app stays as-is — it's a different role (transparent inline mark, not a launcher tile).

## Files to replace (asset swap)

Copy the uploaded PNG to a working path, then re-export to the right sizes/formats:

| Target | Used for | How |
|---|---|---|
| `public/favicon.png` | Browser tab favicon | Resize → 64×64 PNG |
| `public/apple-touch-icon.png` | iOS home-screen "Add to Home Screen" | Resize → 180×180 PNG |
| `public/pwa-192.png` | Android PWA install | Resize → 192×192 PNG |
| `public/pwa-512.png` | Android PWA splash / high-DPI | Resize → 512×512 PNG |
| `public/pwa-maskable-512.png` | Android adaptive (maskable) | 512×512 PNG with the mark scaled to ~70% inside the safe zone, white background extended edge-to-edge |
| `src/assets/ledge-app-icon.webp` | In-app references to the launcher tile (InstallPrompt, LedgeSealMoment, etc.) | Re-export as 512×512 WebP |

ImageMagick will be used (via `nix run nixpkgs#imagemagick`) to do the resize + maskable composition in one pass.

## Files NOT touched

- `src/assets/ledge-mark.webp` — bare inline mark (sidebar, AuthShell, Welcome cover, loader). Different role. Stays.
- `src/assets/ledge-mark-watermark.webp` — large faint watermark on PDFs/auth. Stays.
- `src/assets/ledge-logo.webp` — full wordmark. Stays.
- `index.html`, `manifest.webmanifest` — paths already point at the filenames above, no markup edits needed.

## Verification

After the swap, re-view each generated file with `code--view` to confirm:
- Favicon is crisp at small size (the stripes shouldn't muddy)
- Maskable variant has the mark fully inside the inner 80% safe zone (so Android's circle/squircle crop doesn't clip it)
- WebP re-export of `ledge-app-icon.webp` looks identical to the source PNG

Then bump `theme_color` in `manifest.webmanifest`? — No, current `#0F1F3A` (Midnight) is correct for the Android status bar; the launcher tile is white but the chrome around it should stay Midnight. No change.

## Out of scope

- Logo wordmark redesign
- Splash screen layout (just consumes the existing mark)
- iOS splash images beyond apple-touch-icon (none currently configured)

Single-session change. Ship after visual QA of the 6 regenerated files.
