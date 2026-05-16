
# New Ledge logo — global swap

The uploaded artwork is the new horizontal Ledge wordmark (striped-square mark + serif "Ledge"). I'll replace every Ledge logo render — landing + app + auth pages — with this single source of truth.

## Asset work

1. **Replace `src/assets/ledge-logo.png`** with the uploaded file (full horizontal wordmark).
2. **Regenerate `src/assets/ledge-mark.png`** by cropping just the striped-square portion of the new artwork (used in the collapsed sidebar and as the app icon avatar). Same shape and aspect ratio as today — drop-in.
3. **Leave `src/assets/ledge-app-icon.png` untouched** — it's a tinted square used as the PWA-style install card. We can refresh it in a follow-up if you want; this pass keeps it.
4. **Favicon / PWA icons (`public/favicon.png`, `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`, `apple-touch-icon.png`) — out of scope** for this pass. Flag if you want them regenerated from the new mark and I'll do it next.

## Code swaps

These five files already consume `ledge-logo.png` / `ledge-mark.png` via ES imports — no code change needed once the asset files are updated:
- `src/components/landing/sections/Navbar.tsx`
- `src/components/landing/MobileMenuOverlay.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/components/SplashScreen.tsx`
- `src/components/ui/ledge-loader.tsx`

Four places currently render "Ledge" as **text** instead of the logo image. I'll swap each to `<img src={ledgeLogo} alt="Ledge" />` matched to the existing text height:
- `src/components/landing/sections/Footer.tsx` (line 61, brand block top)
- `src/components/layout/AppLayout.tsx` (line 159, mobile topbar)
- `src/pages/Login.tsx` (line 84)
- `src/pages/Signup.tsx` (line 94)
- `src/pages/ResetPassword.tsx` (line 85)

In each of those five, I'll preserve the surrounding `<Link>` / layout and sizing (`h-7` for nav, `h-9–h-10` for auth pages, `h-6` for mobile topbar).

## Out of scope
- Favicon / PWA icon regeneration (ask if wanted).
- `ledge-app-icon.png` (install-card icon).
- Email templates, OG image, marketing PDFs — flag separately if they need a refresh.

## Verification
- After swap, visually check Navbar, Footer, mobile menu, AppSidebar (expanded + collapsed), AppLayout mobile topbar, and the three auth pages render the new wordmark crisply.

Ready to ship on approval.
