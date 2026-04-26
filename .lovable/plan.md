Emergency plan to get the landing page launch-safe with minimal risk and no extra polish scope.

Root cause found in the current code:
- The mobile menu is still manipulating browser history with `pushState` and `history.back()` just to close the overlay. That can trigger `popstate` races and leave the page in a broken/frozen state.
- The menu also locks `document.body.style.overflow`, relying on animation cleanup to restore it. If the close/unmount sequence races, the page can remain non-interactive.
- The mobile WhatsApp FAB and sticky CTA add extra fixed layers/animations on top of the page. Since you reported “right side WhatsApp button” and mobile issues affecting desktop, the safest launch move is to remove these two floating mobile layers entirely.
- Console also shows ref warnings from Framer/Radix interactions around the menu/footer icon. These are not the main freeze cause, but I’ll remove the risky animated/footer tooltip usage inside the mobile overlay path.

Implementation in one pass:
1. Replace `MobileMenuOverlay` lifecycle with a simple, stable overlay:
   - No `window.history.pushState`.
   - No `window.history.back()`.
   - No body scroll lock mutation.
   - Keep Escape-to-close.
   - Keep premium enter/exit animation, but make it purely visual.
   - Add `onAnimationStart`/exit pointer-events guard if needed so closing overlay cannot block the page.

2. Remove risky mobile floating conversion layers:
   - Temporarily unmount `MobileWhatsAppFab` and `MobileStickyCtaBar` from `Index.tsx`.
   - Keep footer phone/WhatsApp CTAs and normal section CTAs intact, so lead generation remains available without fixed overlay risk.

3. Remove mobile-overlay warning source:
   - Replace `Nilavilakku` inside the mobile menu footer with a simple non-tooltip inline text/icon or plain text.
   - This avoids Radix/Framer ref warnings in the mobile menu close path.

4. Run a quick build/type check after changes.

Expected result:
- Opening and closing the mobile menu will no longer freeze the page.
- Desktop will no longer be affected by mobile fixed overlays or history mutations.
- WhatsApp lead capture remains through visible page CTAs/footer, but the risky right-side floating WhatsApp button is removed for launch stability.
- This is intentionally conservative: stability over extra animation/polish because launch is today and credits are low.