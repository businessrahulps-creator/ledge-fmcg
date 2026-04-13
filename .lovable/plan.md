

# Premium "More" Menu Redesign

## Current State
The bottom-sheet "More" menu uses a plain grid layout with small icons, thin section labels, and minimal visual hierarchy. It works but feels utilitarian.

## Proposed Changes — all in `src/components/layout/AppLayout.tsx`

### 1. Drag handle indicator
Add a small rounded pill bar at the top of the sheet (like iOS action sheets) — a `div` with `w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-3`.

### 2. Larger, more tactile icon buttons
- Increase icon container to 48×48px with a subtle `bg-muted/40` rounded-2xl background behind each icon
- Active state gets `bg-primary/10` with primary-colored icon
- Increase icon size from `h-5 w-5` to `h-6 w-6`
- Add `gap-2` between icon and label

### 3. Better typography
- Section labels: slightly larger (`text-xs`), with `text-muted-foreground/50` and a thin bottom border or dotted separator
- Item labels: `text-xs font-medium` (up from `text-[11px]`)

### 4. Spacing and padding
- More generous padding: `px-6 pt-2 pb-12`
- Group spacing: `space-y-6` (up from `space-y-5`)
- Grid gap: `gap-2` (up from `gap-1`)

### 5. Subtle entry animation
- Add `framer-motion` stagger on the grid items — each icon fades in and shifts up slightly with a 30ms stagger delay

### 6. Activity History shortcut
- Add an "Activity" item to the Analyze group (History icon, links to opening the ActivityLog sheet or a dedicated route), so the audit trail is accessible from mobile

## Files Changed
- `src/components/layout/AppLayout.tsx` — all visual changes to the More sheet

## Impact
- No functional changes, purely visual polish
- Matches premium iOS-style action sheet patterns
- Better touch targets (48px icons vs current ~40px)

