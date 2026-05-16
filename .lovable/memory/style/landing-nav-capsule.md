---
name: Landing nav capsule
description: Arc/Raycast-style split-capsule navbar — two capsules at top, merge into one pill on scroll, with ⌘K palette, live status dot, gradient-ringed CTA
type: design
---
Landing `Navbar.tsx` uses a split-capsule pattern:
- **Top of page (scrollY ≤ 16):** two separate floating capsules — left = logo + divider + green pulsing "All systems operational" status; right = Features/How It Works/Pricing links + divider + ⌘K kbd chip + Sign in + Start Free Trial CTA.
- **Scrolled (>16px):** capsules slide inward (spring 220/28, max-width 1280→920) and inner radii animate to 0, visually merging into a single Arc-style island pill.
- **Mobile (<768px):** single full-width pill — logo left, ⌘K search icon + hamburger right. Existing `MorphHamburger`/`MobileMenuOverlay` flow untouched.

**⌘K palette** (`NavCommandPalette.tsx`) uses shadcn `CommandDialog` (cmdk). Sections: Navigate / Account / Contact. Opens on ⌘K (Mac) or Ctrl+K. Anchor links smooth-scroll to `#features` etc.

**Primitives in `src/index.css`:** `.lp-nav-capsule`, `.lp-nav-divider`, `.lp-nav-link` (ink underline on hover via `::after scaleX`), `.lp-nav-kbd` (kbd chip), `.lp-nav-cta` (Midnight gradient pill with conic gradient ring `::before` animating `lp-nav-cta-spin` 8s; brightens on hover), `.lp-nav-status` + `.lp-nav-status-dot` (Forest ping), `.lp-nav-wordmark` (Playfair).

Tokens only — no raw colors. Respects `prefers-reduced-motion`.
