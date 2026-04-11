

# UX Fix: Performance Header Layout

## Issue
The uploaded screenshots show the desired layout:
1. **Screenshot 1**: Pills and "Custom" button on one row, date pickers ("From" / "To") on a **separate row below** the pills — not inline beside them
2. **Screenshot 2**: Clean pill bar with generous spacing, the active pill (30D) clearly distinct

Current code puts the Export button, pills, and date pickers all in one `flex-wrap` container, causing cramped inline layout.

## Changes — `src/pages/Performance.tsx` (lines 342-428)

1. **Separate the date pickers from the pill row**: Move the `period === "custom"` date picker block outside and below the pill container, into its own row beneath the pills.

2. **Move Export button**: Place it after the pills (right side) or keep it where it is but ensure visual separation.

3. **Layout structure**:
```
Row 1: [Performance title/subtitle]  [pill bar]  [Export btn]
Row 2 (conditional): [From picker] to [To picker]   ← only when Custom selected
```

4. **Date picker styling**: Use `rounded-full` buttons (matching pill aesthetic) with slightly more padding (`h-9 w-[140px]`) and `text-sm` instead of `text-xs` for consistency.

This is a layout-only change (~15 lines moved/adjusted), no logic changes.

