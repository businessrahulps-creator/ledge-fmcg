# Landing page image performance pass

## Problem

The four hero/step screenshots in `src/assets/landing/` are uncompressed PNGs at ~1.2–1.3 MB each (≈5.1 MB total) — this dominates landing page payload and slows LCP. Logo PNGs are also unoptimized (`ledge-logo.png` 113 KB, `ledge-app-icon.png` 98 KB, `ledge-mark.png` 37 KB). No `fetchpriority` / `preload` is set on the LCP image.

## What to ship

### 1. Convert heavy PNGs to WebP

Using `sharp` (or `nix run nixpkgs#libwebp`), regenerate at ~80 quality, max width 1920px:

| File | Before | Expected after |
|---|---|---|
| `landing/hero-dashboard.png` | 1.3 MB | ~120 KB `.webp` |
| `landing/step-orders.png` | 1.2 MB | ~110 KB `.webp` |
| `landing/step-stock.png` | 1.3 MB | ~110 KB `.webp` |
| `landing/step-billing.png` | 1.3 MB | ~110 KB `.webp` |
| `ledge-logo.png` | 113 KB | ~15 KB `.webp` |
| `ledge-app-icon.png` | 98 KB | ~12 KB `.webp` |
| `ledge-mark.png` | 37 KB | ~6 KB `.webp` |
| `public/ledge-mark-watermark.png` | 37 KB | ~6 KB `.webp` |

Delete the original PNGs after replacement (no other refs).

### 2. Update imports

Switch imports from `.png` → `.webp` in:
- `Hero.tsx`, `HowItWorks.tsx` (landing screenshots)
- `Navbar.tsx`, `MobileMenuOverlay.tsx`, `Footer.tsx`, `Testimonials.tsx`, `SplashScreen.tsx`, `AppSidebar.tsx`, `AppLayout.tsx`, `Login.tsx`, `Signup.tsx`, `ResetPassword.tsx`, `ledge-loader.tsx` (logos)

Keep PNG variants for: `apple-touch-icon.png`, `favicon.png`, `pwa-*.png` (PWA spec requires PNG).

### 3. Loading hints

- Hero image (`<img src={heroDashboard}>`): add `fetchPriority="high"` and `decoding="async"`. Add `<link rel="preload" as="image" href="...">` in `index.html` is skipped (Vite hashes the URL); rely on `fetchpriority`.
- Step screenshots, testimonial avatars, footer/nav logos: ensure `loading="lazy"` + `decoding="async"`. Audit current `<img>` tags in `HowItWorks`, `Testimonials`, `Founder`, `Footer`, `Navbar`.
- Add explicit `width` / `height` attributes on the four landing screenshots and avatars to prevent CLS.

### 4. Out of scope

- No new build plugins (no `vite-imagetools`) — one-shot conversion is enough.
- No layout, copy, or motion changes.
- No PWA icon changes (must remain PNG).

## Verification

- `du -sh src/assets/landing` drops from ~5.1 MB to <600 KB.
- Build succeeds; preview renders hero + step screenshots correctly.
- Network tab on `/`: hero image transfers <150 KB; total image bytes <800 KB.
