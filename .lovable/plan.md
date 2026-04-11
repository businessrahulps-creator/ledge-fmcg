

# Fix: Mobile Pill Bar Overflow

## Problem
On mobile (390px), the period pill bar shows only "Today" through "YTD" — the "Custom" pill and "Export" button are clipped off-screen with no way to scroll or access them.

## Solution
Make the pill container horizontally scrollable on mobile with `overflow-x-auto` and hide the scrollbar for a clean look. Move the Export button below or make it part of the scrollable row.

## Changes — `src/pages/Performance.tsx`

1. **Pill container** (~line 350): Add `overflow-x-auto` and `scrollbar-hide` (or `-webkit-scrollbar` hide via inline style) to the flex row containing the pills + Export button, so the entire row is swipeable on mobile.

2. **Alternatively**, wrap pills in a scrollable div and keep Export outside:
   ```
   Row 1: [scrollable: Today | 7D | 30D | 90D | 6M | YTD | Custom]  [Export]
   ```
   With `flex-shrink-0` on the Export button so it stays visible, and the pill bar scrolls independently.

3. Add `whitespace-nowrap` to prevent pills from wrapping awkwardly at intermediate sizes.

This is a ~3-line CSS change, no logic modifications.

