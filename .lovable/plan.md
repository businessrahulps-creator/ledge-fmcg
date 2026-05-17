# Motion Law — Surgical Implementation Plan

Apply one unified motion language across routes, sheets, dialogs, buttons, cards, and toasts. Six files touched. No data, no tables, no form fields animated. `prefers-reduced-motion` collapses to opacity-only 120ms everywhere via Tailwind's `motion-reduce:` variants.

## Files touched (exactly 6, all already in scope)

1. `src/components/layout/AppLayout.tsx` — route transition
2. `src/components/ui/sheet.tsx` — drawer spring
3. `src/components/ui/dialog.tsx` — modal spring
4. `src/components/ui/button.tsx` — press state
5. `src/components/ui/card.tsx` — hover state (desktop)
6. `src/components/ui/sonner.tsx` — toast position

No other file modified. No new CSS tokens, no new keyframes, no edits to `index.css`, `tailwind.config.ts`, or `motion.ts`.

## Per-file change

### 1. AppLayout.tsx — Route cross-fade (lines 313–324)
Replace the current spring fade with the Motion Law:
- `initial={{ opacity: 0, x: 4 }}` (new route enters from 4px forward)
- `animate={{ opacity: 1, x: 0 }}`
- `exit={{ opacity: 0, x: -4 }}` (old route recedes)
- `transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}`
- Wrap with `useReducedMotion()` from framer-motion; when true → opacity only, `duration: 0.12`, no x.
- `AnimatePresence mode="wait"` stays.

### 2. sheet.tsx — Spring-like edge slide
True CSS spring is not native; approximate stiffness 260 / damping 28 with a slight-overshoot cubic-bezier so it reads as a settle, not a snap.
- On `sheetVariants` base class: change `data-[state=open]:duration-500 data-[state=closed]:duration-300` → `data-[state=open]:duration-[360ms] data-[state=closed]:duration-[220ms] data-[state=open]:ease-[cubic-bezier(0.34,1.15,0.55,1)] data-[state=closed]:ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:duration-[120ms] motion-reduce:ease-linear motion-reduce:transition-opacity motion-reduce:!animate-none`
- Overlay (line 22): tighten to `data-[state=open]:duration-[220ms]` and add `motion-reduce:duration-[120ms]`. No translate on overlay.

### 3. dialog.tsx — Spring from center
- `DialogContent` (line 39): replace `duration-200` with `data-[state=open]:duration-[280ms] data-[state=closed]:duration-[180ms] data-[state=open]:ease-[cubic-bezier(0.34,1.15,0.55,1)] data-[state=closed]:ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:!duration-[120ms] motion-reduce:ease-linear`.
- Keep the existing zoom + slide-from-top-48% (acts as "nearest edge" feel from the trigger area). Strip the `slide-out-to-left-1/2 / slide-in-from-left-1/2` pair to remove horizontal jitter — keep vertical only.
- Overlay (line 22): mirror sheet overlay timing.

### 4. button.tsx — 1px depress, 4% opacity, 90ms
- Update root cva string (line 16): change `duration-fast` → `duration-[90ms]` and append `motion-reduce:transition-opacity motion-reduce:duration-[120ms]`.
- Variant `active:` states: change every `active:translate-y-[0.5px]` → `active:translate-y-px active:opacity-[0.96] motion-reduce:active:translate-y-0`. Applies to: default, destructive, secondary, success. For outline → add `active:opacity-[0.96] motion-reduce:active:translate-y-0` alongside existing `active:translate-y-[0.5px]` replaced to `active:translate-y-px`. Ghost/subtle/link/pill: add `active:opacity-[0.96]` only (no translate on link).

### 5. card.tsx — Desktop hover lift + depth-8
- Card root (line 14): extend className to `rounded-md border border-border/70 bg-card text-card-foreground shadow-depth-2 transition-[box-shadow,border-color,transform] duration-normal ease-fluent md:hover:-translate-y-1 md:hover:shadow-depth-8 motion-reduce:transform-none motion-reduce:transition-opacity`.
- Mobile (no `md:`) sees no transform — touch devices shouldn't fake hover.
- SignalCard and other composed cards inherit automatically (they wrap Card or use depth-2 directly; we only touch the primitive).

### 6. sonner.tsx — Bottom-center on mobile
- Line 17: `position={isMobile ? "top-center" : "bottom-right"}` → `position={isMobile ? "bottom-center" : "bottom-right"}`.
- Sonner's own enter animation already springs from the chosen edge; no further change.

## Reduced-motion contract
Every animated rule above pairs with a `motion-reduce:` variant that:
- Removes transforms (`motion-reduce:transform-none` / `motion-reduce:translate-y-0`)
- Caps duration to 120ms
- Switches to linear/opacity-only transition
The route transition reads `useReducedMotion()` at runtime and emits the opacity-only variant.

## Out of scope (explicitly NOT touched)
- Tables, form fields, NumberInput, KPI numbers — no animation changes
- `src/lib/motion.ts` — tokens unchanged
- `index.css`, `tailwind.config.ts` — no new keyframes (existing `duration-normal`, `ease-fluent`, `shadow-depth-8`, `shadow-depth-2` already exist)
- All consumers of Button/Card/Sheet/Dialog — they inherit automatically
- AlertDialog, HoverCard, Popover — not in the user's list
- Landing-page Press/Magnetic wrappers — separate motion contract
- AnimatePresence usage inside NotificationCenter, onboarding moments — out of scope

## Verification after build
- `/orders/new` → `/orders` cross-fade: 220ms, 4px forward parallax
- Open mobile bottom-nav sheet: springs from bottom
- Open any Dialog: settles with slight overshoot
- Tap primary CTA: 1px down, slight dim, snaps back in <100ms
- Hover any Card on desktop: lifts 4px, depth-8 shadow
- Trigger a toast on mobile: appears bottom-center
- DevTools → Rendering → Emulate prefers-reduced-motion: all transforms disappear, opacity-only at 120ms