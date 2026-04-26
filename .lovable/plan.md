
## Goal

Transform the mobile navigation from a stock shadcn side-sheet into a **cinematic, full-screen overlay** that matches the million-dollar feel of the rest of the landing page — Apple/Linear/Vercel grade. Plus upgrade the hamburger button into an animated morph icon with brand-quality polish.

**Strict guardrails:**
- Desktop nav (`md:` and up) is **untouched**.
- No layout, color, copy, or font changes outside the mobile nav surface.
- All existing landing page primitives (`lp-btn-primary-dark`, `lp-shimmer`, `lp-noise`, Nilavilakku) are reused — no new design language invented.
- Respects `prefers-reduced-motion` (animations gated, content always accessible).

---

## What ships

### 1. Animated Morph Hamburger (`MorphHamburger.tsx` — new)

Replace the static Lucide `Menu` icon with a custom 2-line SVG that **morphs into an X** with spring physics when the menu opens.

- Two horizontal lines (24px wide, 1.75px stroke, `#0A0F1C`).
- On open: top line rotates +45° and shifts down, bottom line rotates −45° and shifts up — meeting at center to form an X.
- Spring: `{ type: "spring", stiffness: 380, damping: 28, mass: 0.5 }` (snappy but settled).
- Container: existing 36×36 glass pill (`bg-white/70 backdrop-blur-md`), but adds:
  - Subtle inner glow on press (`box-shadow: inset 0 0 0 1px rgba(10,15,28,0.08)`).
  - `whileTap={{ scale: 0.92 }}` for tactile feedback.
- `aria-label` toggles "Open menu" / "Close menu"; `aria-expanded` reflects state.
- Reduced-motion: skips spring, instant swap.

### 2. Cinema Overlay (`MobileMenuOverlay.tsx` — new)

A **full-viewport** overlay (replaces the `Sheet`/`SheetContent` for mobile only — desktop unchanged).

**Architecture:**
- Rendered via `AnimatePresence` from framer-motion.
- `position: fixed inset-0 z-[60]` (above the navbar, which stays at z-50).
- Body scroll-locked while open (`document.body.style.overflow = 'hidden'`).
- Closes on: tap link, tap close button, `Escape` key, browser back button (history `popstate`).
- Focus trap: first focusable element receives focus on open, returns focus to hamburger on close.

**Visual layers (back to front):**
1. **Background**: `bg-white` with `lp-noise` overlay at 40% opacity for tactile texture.
2. **Soft radial wash**: a single warm light bloom at top-center (`radial-gradient(60% 40% at 50% 0%, rgba(10,15,28,0.04), transparent)`) — adds depth.
3. **Content stack** (vertical flex, `px-7 py-6`):

   **Top bar (h-[60px], aligns with navbar):**
   - Ledge wordmark (logo image, h-7) on the left — animates in with `blurFadeUp`, delay 0.05s.
   - Close hamburger (the same MorphHamburger, now in X state) on the right.

   **Middle — link list (flex-1, centered vertically with slight top bias):**
   - 4 links rendered as **large display type**: `font-heading font-semibold text-[40px] leading-[1.05] tracking-[-0.02em] text-[#0A0F1C]`.
   - Each link is a row: small numeric label `01 02 03 04` in `text-[11px] text-[#A1A1AA] tracking-[0.18em]` above the word — *correction:* user previously rejected `[ 01 ]` numerals on the landing page; **we will NOT use numerals here either** (memory: landing-palette).
   - Instead: small **lowercase label** in `text-[11px] uppercase tracking-[0.22em] text-[#94A3B8]` above each link (e.g. `Discover`, `Explore`, `Learn`, `Plans`) — gives editorial rhythm without re-introducing the rejected numeral pattern.
   - Each link uses **TextReveal-style staggered word entry** with `blurFadeUp`:
     - Stagger: 0.06s between items, base delay 0.12s.
     - Spring: `{ type: "spring", stiffness: 200, damping: 24, mass: 0.7 }`.
   - Hover/active state (touch-friendly): a thin `1px` underline sweeps left-to-right under the active link with spring; on press, link scales to 0.98 and opacity dips to 0.85.
   - Tap → `setOpen(false)` → smooth scroll to `#features` etc. (existing anchor behavior preserved).

   **Trust strip (between links and CTAs):**
   - Single subtle chip, centered: `30-day free trial · No card · Cancel anytime`.
   - Style: `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A0F1C]/[0.04] border border-[#0A0F1C]/[0.06] text-[12px] text-[#52525B] font-medium`.
   - Tiny green pulse dot on the left (existing `.lp-pill-accent` settle animation reused — single pass, not infinite).
   - Reveals last in the stagger (delay 0.36s).

   **Bottom — CTAs:**
   - Primary: `Get Started Free` — uses existing `lp-btn-primary-dark lp-shimmer`, rounded-2xl, full-width, py-4. Wrapped in `MagneticWrapper` (already in codebase) for parity with hero CTA.
   - Secondary: `Sign in` — ghost style, full-width, py-4, rounded-2xl, `bg-[#0A0F1C]/[0.04]`.
   - Both reveal with stagger (delays 0.42s, 0.48s).

   **Signature footer (pinned bottom, below CTAs):**
   - `Built in God's Own Country · Kerala` with the existing `<Nilavilakku />` lamp (size sm).
   - Style: `text-[11px] text-[#94A3B8] flex items-center gap-2 justify-center pt-5`.
   - Reveals last (delay 0.54s) — gives the menu a memorable, branded sign-off.

**Overlay entrance/exit choreography:**
- Background: fades + slight scale-up (`scale: 1.02 → 1`) over 280ms with `[0.16, 1, 0.3, 1]` easing (Apple's spring-style cubic).
- Content stack: `blurFadeUp` per row (children stagger).
- Exit: reverse — content fades fast (160ms), background fades last (220ms). Feels like the screen is "putting itself back together."

### 3. `Navbar.tsx` refactor (surgical)

- Keep desktop branch (`hidden md:flex`) **100% identical**.
- Replace the mobile `Sheet` block with: `<MorphHamburger open={open} onClick={() => setOpen(o => !o)} />` + `<AnimatePresence>{open && <MobileMenuOverlay onClose={() => setOpen(false)} />}</AnimatePresence>`.
- Hide the navbar's logo when overlay is open (or fade it to 0) to avoid double-logo flash — overlay has its own logo in the same position so it feels like the navbar morphs into the menu.

### 4. CSS additions to `src/index.css`

Three small utility additions in the existing landing-page section:
- `.lp-mobile-menu-bg` — the radial wash + base color combo (one rule, ~6 lines).
- `.lp-menu-link-eyebrow` — the editorial uppercase label styling.
- `.lp-menu-link-underline` — the spring underline indicator.

No changes to existing tokens or utilities.

---

## Files

**New (3):**
- `src/components/landing/MorphHamburger.tsx`
- `src/components/landing/MobileMenuOverlay.tsx`
- (No new hook needed — reuses `useEffect` for body scroll lock inline.)

**Edited (2):**
- `src/components/landing/sections/Navbar.tsx` — swap mobile Sheet block for MorphHamburger + Overlay; keep desktop intact.
- `src/index.css` — add three small utility classes in the landing section.

**Untouched:**
- All other landing sections, the desktop nav, `MagneticWrapper`, `TextReveal`, `Nilavilakku`, `CapsuleCTA`, motion tokens.

---

## Why this is world-class (vs. today)

| Today | After |
|---|---|
| Generic side-sheet, looks like an admin panel | Full-screen cinema overlay, looks like a marketing site |
| "Menu" title wastes hero space | Brand wordmark stays visible — feels continuous |
| 4 small links + huge whitespace gap | 4 large display links + editorial eyebrow labels + trust chip + Kerala signature fill the screen with intention |
| Static Lucide hamburger | Custom morph hamburger with spring physics — a micro-detail people notice |
| All links pop in at once | Staggered blur-fade-up per row — feels like content is "developing" onto the screen |
| Trial proof missing on mobile | Subtle chip with pulse dot reinforces conversion |
| No brand signature | Nilavilakku + Kerala line gives a memorable, culturally-rich moment |
| No tap feedback | Spring scale on hamburger + link press states |
| Body scrolls behind sheet | Body locked, focus trapped, Esc closes — accessibility-first |

---

## Inspiration sources (Apple/Framer/Linear patterns applied)

- **Apple.com mobile menu**: full-screen takeover, large editorial type, fast cubic-bezier easing.
- **Linear.app mobile**: micro-eyebrows above primary nav items, single-pass shimmer on CTA.
- **Vercel.com mobile**: staggered blur reveal, Esc-to-close, body scroll lock.
- **Framer Motion docs**: morph hamburger via `motion.path` with spring transform.

---

## Out of scope (intentional)

- No haptics (web has no reliable haptic API; would feel inconsistent).
- No theme switcher inside menu — not requested.
- No social/contact links inside menu — keeping it laser-focused on conversion + nav.
- No search field — landing page doesn't need it.

Approve and I'll ship it in one clean pass.
