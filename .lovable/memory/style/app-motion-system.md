---
name: App motion system (signed-in app)
description: Duration/easing vocabulary and press-feedback rules for the /app surfaces — separate from the landing page motion v2/v3 system
type: design
---
Applies to the signed-in app only (landing page keeps mem://style/motion-v2).

**Durations:** 120ms feedback (press, row hover), 140–160ms menus/tooltips/popovers/selects,
240ms sheets and dialogs open. Exits are always shorter than entrances (100–180ms).
Nothing in app chrome exceeds 300ms.

**Easings:** open `cubic-bezier(0.2, 0.9, 0.25, 1)`, close `cubic-bezier(0.4, 0, 1, 1)`.
`ease-in`/`ease-in-out` on UI is forbidden.

**Origin:** dropdown-menu, select, popover and tooltip content use
`origin-[var(--radix-*-content-transform-origin)]` so they scale from their trigger.

**Page changes:** no `AnimatePresence mode="wait"` around the route body in AppLayout —
the new page enters immediately (140ms opacity + 2px y), the old one does not block it.

**Press feedback:** `.card-hover` and `.pressable` scale to 0.985 on `:active`;
hover effects gated behind `@media (hover: hover) and (pointer: fine)`;
`prefers-reduced-motion` drops transforms but keeps colour/opacity.

**Staggers:** capped — `Math.min(index, 4–5) * 0.03–0.045` so long lists don't ripple.
