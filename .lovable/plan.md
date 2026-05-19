# Mobile Search & Dropdown Rebuild

## Problem

On phones the universal search (`CommandPalette`) and the searchable dropdowns (`EntityPicker` used in New Order, Stock, etc.) both render as desktop primitives:

- **CommandPalette** uses a centered `Dialog` (`max-w-lg`) with a fixed `max-h-[300px]` list. On a 375px screen it leaves tiny gutters, the on-screen keyboard covers half the results, and long order/dealer rows truncate awkwardly.
- **EntityPicker** uses a Radix `Popover` whose width is locked to the trigger (`w-[--radix-popover-trigger-width]`). Inside a narrow form column the dropdown is ~150px wide, the search input has no breathing room, and tapping it on iOS scrolls the popover off-anchor.
- Neither surface handles the iOS visual-viewport keyboard inset — the list scrolls behind the keyboard instead of resizing.

## Goal

A single mobile pattern: **slide-up full-height sheet** with a sticky search header, results that fill the remaining viewport, and a safe-area-aware bottom padding. Desktop behavior is unchanged.

## Approach

### 1. New primitive: `MobileSearchSheet`
`src/components/ui/mobile-search-sheet.tsx`

- Wraps Radix `Dialog` but renders a top→bottom slide sheet pinned to `inset-0` on mobile (`< md`).
- Layout:
  ```text
  ┌─ sticky header (safe-area-top, 56px) ─┐
  │  [back]  search input         [clear] │
  ├───────────────────────────────────────┤
  │  scrollable results region            │
  │  (flex-1, overscroll-contain)         │
  ├─ optional sticky footer (hint chips) ─┤
  └───────────────────────────────────────┘
  ```
- Uses `100dvh` + `env(safe-area-inset-bottom)` so the iOS keyboard collapses the list region instead of overlapping it.
- Auto-focuses the search input after the open animation (delay ~120 ms to avoid iOS focus-jump).
- Exposes slots: `header`, `children` (results), optional `footer`.

### 2. `CommandPalette` — responsive split
`src/components/CommandPalette.tsx`

- Use `useIsMobile()`.
- Desktop: existing `CommandDialog` (unchanged).
- Mobile: render `MobileSearchSheet` containing a `cmdk` `Command` tree with the same groups (Recent, Quick actions, Go to, Orders, Dealers, Products).
  - List uses `flex-1 min-h-0 overflow-y-auto` so it stretches.
  - Rows get a 48px touch target and 2-line layout (label + muted hint).
  - Empty state and "Showing N of M" footer reuse existing copy.
- Mobile topbar search button still dispatches `ledge:open-command-palette` — no consumer changes.

### 3. `EntityPicker` — sheet variant on mobile
`src/components/ui/entity-picker.tsx`

- Detect mobile via `useIsMobile()`.
- Desktop: keep current Popover behavior.
- Mobile: trigger opens `MobileSearchSheet` with the same search input, filtered list, and row template (label / hint / meta chip). Selecting a row commits and closes the sheet.
- All existing props (`options`, `value`, `onChange`, `placeholder`, `searchPlaceholder`, `emptyHint`, `helperText`, `maxHeight`) stay; `maxHeight` is ignored on mobile (full sheet).
- No call-site changes needed in `NewOrder.tsx`, `Stock.tsx`, etc.

### 4. Small polish
- Add `overscroll-behavior: contain` and `touch-action: pan-y` to the results regions so a scroll inside the sheet doesn't pull the page.
- Lock body scroll while sheet is open (Radix already handles this via Dialog).
- Tap-target audit: ensure every row is ≥44px and uses `active:bg-muted/60` for tactile feedback.
- Respect `prefers-reduced-motion` — disable slide animation.

## Files

**New**
- `src/components/ui/mobile-search-sheet.tsx`

**Edited**
- `src/components/CommandPalette.tsx` — desktop/mobile branch
- `src/components/ui/entity-picker.tsx` — desktop/mobile branch

## Out of scope
- No changes to search ranking, fuzzy matching, or which entities are searchable.
- No changes to desktop layouts.
- Saved views / print menus stay as is.

## Verification
- Manual at 375 × 812 (iPhone SE/13): open palette from mobile topbar → keyboard appears, list shrinks above it, scrolling stays inside sheet.
- New Order at 360 × 800: open Dealer picker → full-height sheet, typing filters, tap commits and returns to form.
- Stock "Add Product" at 360 × 800: same sheet flow.
- Desktop (≥768px): both surfaces render exactly as today (visual diff = none).
- `bun run tsc --noEmit` clean.
