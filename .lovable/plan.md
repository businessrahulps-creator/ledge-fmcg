## Problem

After opening and closing the mobile menu, the entire site freezes — no scrolling, no clicks register. Reproduces in mobile browsers and via responsive view in desktop browsers.

## Root cause (three compounding bugs in `MobileMenuOverlay.tsx`)

1. **`document.body.style.overflow` is never reliably restored.**
   - We capture `prevOverflow` at mount and restore on unmount.
   - Unmount runs *after* the 360ms Framer Motion exit animation completes — but the cleanup also calls `history.back()` synchronously, which can race with React's unmount and leave `body { overflow: hidden }` permanently applied. This is what locks scroll.

2. **Back-button choreography breaks navigation.**
   - We `pushState({ mobileMenu: true })` on mount and `history.back()` on cleanup.
   - When the user closes via the X button (not the back gesture), `history.back()` fires *and* the popstate listener is still attached → it calls `onClose()` again → React schedules another unmount → during exit, the overlay is still on top intercepting clicks.
   - The result is a stuck full-screen invisible layer + body scroll lock.

3. **The exiting overlay continues to capture pointer events** during the 360ms exit animation (no `pointer-events: none` on exit), so even after the menu visually fades, the page is unclickable for a moment — and combined with bug #1, permanently.

## Fix (surgical, in one file: `src/components/landing/MobileMenuOverlay.tsx`)

1. **Lock scroll the safe way.** Always restore `document.body.style.overflow = ""` (empty string, not the captured value) in cleanup. This guarantees the inline style is removed regardless of what was there before.

2. **Remove the `history.back()` in cleanup.** Keep the `pushState` + `popstate` listener so the Android back gesture still closes the menu, but do **not** call `history.back()` from cleanup. Instead:
   - Track whether close was triggered by popstate (back gesture) using a ref. If yes → state is already popped, do nothing.
   - If no (X button, link click, Esc) → call `history.back()` *once* before triggering the close animation (not in cleanup), so the listener can handle it cleanly.
   - Use a `closingRef` flag to ensure `onClose` only fires once.

3. **Disable pointer events during exit.** Add `style={{ pointerEvents: open ? 'auto' : 'none' }}` on the root `motion.div`, OR use Framer Motion's `exit` to animate `pointerEvents: 'none'` immediately at exit start.

4. **Idempotent `onClose`.** Wrap the parent's `onClose` in a guard so multiple rapid triggers (popstate + click + esc) don't queue multiple unmounts.

## Files touched

- `src/components/landing/MobileMenuOverlay.tsx` — fix scroll-lock cleanup, remove history.back() race, add pointer-events guard, idempotent close.
- `src/components/landing/sections/Navbar.tsx` — wrap `setOpen(false)` in a tiny guard (or rely on the overlay's internal guard). Likely no change needed once overlay is fixed.

## What stays the same

- The premium open/close animation choreography (reverse stagger, blur-out, scale).
- Esc key, back-gesture, and X-button all still close the menu.
- All other landing-page behavior is untouched.

## Verification

After the fix:
- Open menu → close via X → page scrolls and all clicks work.
- Open menu → Android back gesture → menu closes, page works.
- Open menu → tap a nav link → navigates correctly, no frozen layer.
- Open → close → open → close repeatedly → no accumulating history entries, no scroll lock.