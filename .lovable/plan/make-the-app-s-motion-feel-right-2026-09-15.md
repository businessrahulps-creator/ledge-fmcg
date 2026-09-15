# Make the app's motion feel right

Reviewed the app's animations against the craft rules in the skills you linked
(justified motion, sub-300ms, responsive easing, correct origin, asymmetric
enter/exit, reduced-motion respect). The bones are good; what's left is a
handful of things that make the app feel slower or less physical than it is.

## What will change

**1. Page changes stop waiting.**
Today every screen change plays the old page out before the new one starts, so
each tap costs an extra beat. The new page will appear immediately with a short
lift, and the old one leaves under it — the same trick native apps use.

**2. Menus and pop-ups open from where you tapped.**
Dropdowns, the select lists, pop-overs and tooltips currently grow from their
own centre. They will grow from the button that opened them, so the connection
between tap and panel is obvious. Opens stay quick (~160ms), closes quicker
(~120ms).

**3. The slide-up sheets get crisper.**
The mobile menu and the return/payment sheets take 360ms to open with a
soft-in-soft-out curve, which reads as sluggish on a phone. They move to ~240ms
open, ~180ms close, with a decisive curve. Menu, being opened dozens of times a
day, gets the least motion of all.

**4. Things you press, press back.**
List rows, order cards, dealer cards, KPI tiles and bottom-bar items get a real
press response on finger-down (a small scale, released instantly), not just
buttons. Nothing waits for the finger to lift.

**5. One motion vocabulary.**
Right now durations and curves are picked ad hoc across the app. Everything
lands on one small set: 120ms for feedback, 160ms for menus, 240ms for sheets
and dialogs, and exits always faster than entrances. Anything above 300ms in
regular app chrome goes.

**6. Lists arrive together, not one by one.**
Where entrance staggers exist on long lists they will be capped to the first few
items, so a 200-row table doesn't ripple.

**7. Reduced motion stays honest.**
Every change keeps the "reduce motion" setting working — movement drops, fades
and colour stay, nothing becomes invisible.

## Out of scope

No change to money calculations, bill raising, stock movements or any business
rule. No new animation libraries. The landing page's own motion system is left
alone — this is the signed-in app only.

## Technical notes

- `AppLayout.tsx`: drop `AnimatePresence mode="wait"` around the route body;
  keep a single keyed `motion.div` with a 140ms opacity+2px enter and no
  blocking exit.
- `dropdown-menu.tsx`, `select.tsx`, `popover.tsx`, `tooltip.tsx`: add
  `origin-[var(--radix-*-content-transform-origin)]` plus explicit
  `data-[state=open]:duration-[160ms]` / `data-[state=closed]:duration-[120ms]`
  and the shared easings.
- `sheet.tsx`: remove the `transition ease-in-out` class; open 240ms with
  `cubic-bezier(0.2,0.9,0.25,1)`, close 180ms with `cubic-bezier(0.4,0,1,1)`.
- Add a `.pressable` utility in `index.css`
  (`transition: transform 120ms; active:scale-[0.985]`, hover gated behind
  `@media (hover:hover) and (pointer:fine)`, disabled under
  `prefers-reduced-motion`) and apply it to list rows/cards and bottom-nav items.
- Consolidate on the existing `--duration-*` / `--ease-*` tokens in `index.css`;
  replace one-off cubic-beziers in app (non-landing) components.
- Verify with typecheck, the Vitest suite and a build, then a signed-in run on
  the demo account at phone and desktop width.
