# Premium Navigation — Split Capsule (Arc/Raycast-style)

Replace the current full-width transparent bar with two floating capsules that slide together into one pill as the user scrolls. Adds a command palette, a live status dot, and a gradient-ringed CTA.

## What the user will see

**At top of page (hero, scrollY = 0):**
- Two separate floating capsules, 14px from the top, in the safe-area inset.
- **Left capsule:** Ledge mark + wordmark, vertical divider, tiny pulsing green dot + "All systems operational" in 12px Inter medium.
- **Right capsule:** Features · How It Works · Pricing links, vertical divider, ⌘K trigger (kbd-style chip), Sign in, then **Start Free Trial** as a Midnight pill with a soft gradient ring (Midnight → Forest at 25% opacity) that brightens on hover.
- Both capsules: 44px tall, `rounded-full`, `bg-card/85` + `backdrop-blur-xl`, `shadow-depth-2`, 1px hairline border.

**After scrolling 16px:**
- The two capsules slide inward (spring) and merge into one centered island pill — logo · status dot · links · ⌘K · Sign in · CTA — like Arc's address bar collapsing.
- Width animates from `max-w-7xl spread` to `~880px centered island` over 320ms with `ease-fluent`.
- Shadow deepens from `depth-2` → `depth-8`.

**Hover interactions:**
- Links get a magnetic ink underline: a 2px Midnight bar that slides in from the left, scaled by mouse proximity (uses existing `MagneticWrapper` pattern).
- ⌘K chip lifts 1px and the kbd glyphs invert color.
- CTA gradient ring rotates 1 full turn over 6s on hover (subtle).

**⌘K command palette:**
- `cmdk` library (already common in shadcn projects — install if missing).
- Opens on ⌘K / Ctrl+K or click. Sections: Navigate (Features, Pricing, How It Works, Founder, Pricing FAQ), Account (Sign in, Start Free Trial), Contact (Call sales, WhatsApp sales).
- 480px wide, frosted card, fuzzy search, arrow-key navigation, Esc to close.

**Mobile (<768px):**
- One single centered pill: logo left, ⌘K replaced by a search icon, hamburger right. No status dot (saves width).
- Keeps existing `MorphHamburger` + `MobileMenuOverlay` flow untouched.

## Why this feels premium

- Two-capsule → one-capsule morph is the signature Arc move; very few Indian B2B SaaS sites do it.
- Live status dot signals "we're a real product, not a landing page."
- ⌘K signals "power tool for operators" — exactly the Indian FMCG distributor persona.
- Gradient ring + Playfair-spaced wordmark inside the pill ties back to the brand without shouting.

## Technical changes

**Files to edit:**
- `src/components/landing/sections/Navbar.tsx` — full rewrite (~180 lines). Uses `useScroll` from framer-motion for capsule merge, `useMotionValue` for magnetic underlines.
- `src/index.css` — add `.lp-nav-capsule`, `.lp-nav-pill`, `.lp-nav-kbd`, `.lp-nav-cta-ring`, `.lp-nav-underline` primitives (~80 lines, semantic tokens only).

**Files to create:**
- `src/components/landing/NavCommandPalette.tsx` — `cmdk`-based palette, ~140 lines.
- `src/components/landing/NavStatusDot.tsx` — small reusable pulsing dot (extracted from existing footer pattern).

**Dependencies:**
- Verify `cmdk` is installed (shadcn `command` component uses it — likely already present). If not, `bun add cmdk`.

**Tokens / no new colors:**
- Reuses existing `--primary` (Midnight), `--success` (Forest), `--card`, `--border`, `--ring`, `shadow-depth-2/8`, `ease-fluent`.
- Gradient ring = `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--success) / 0.4))` masked with `padding-box` trick.

**Motion budget:**
- Capsule merge: 320ms spring (stiffness 220, damping 28).
- Underline magnetic: 60fps `transform: translateX()` only.
- Gradient ring: CSS `@keyframes` 6s linear, paused unless `:hover`.
- Respects `prefers-reduced-motion` — falls back to instant snap + static ring.

**Accessibility:**
- ⌘K trigger has `aria-label="Open command palette"` and visible kbd hint.
- Palette traps focus, returns focus on close.
- Status dot has `role="status"` + `aria-live="polite"`.
- All nav links keep semantic `<a>` / `<Link>`.

**Out of scope (do not touch):**
- Mobile menu overlay logic (`MobileMenuOverlay`, `MorphHamburger`).
- Footer, hero, any section component.
- Auth or routing.

## Verification

1. Scroll from 0 → 200px at 1440px viewport — capsules merge smoothly, no layout shift.
2. Press ⌘K on Mac / Ctrl+K on Windows — palette opens, Esc closes, arrows navigate.
3. Hover each nav link — magnetic underline tracks mouse.
4. Resize to 390px — single mobile pill renders, hamburger still opens overlay.
5. Toggle `prefers-reduced-motion` in devtools — animations collapse to instant.
6. Lighthouse a11y on `/` stays ≥ 95.

## Memory updates after build

- Create `mem://style/landing-nav-capsule` documenting the split-capsule pattern, merge threshold, ⌘K shortcut.
- Update `mem://index.md` Memories list.
