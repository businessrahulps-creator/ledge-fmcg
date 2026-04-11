

# Fix Chart Colors to Match Design System

## Problem
The Performance page charts use ad-hoc colors that clash with the Ledge design system:
- **Product Velocity**: `hsl(38, 92%, 50%)` — bright orange/amber
- **Sales Team Ranking**: `hsl(262, 83%, 58%)` — bright purple/violet
- **Payment Split**: raw green/amber/red HSL values instead of design tokens

The design system uses a navy primary (`--primary: 224 55% 22%`), with semantic tokens for success, warning, and destructive states.

## Changes — `src/pages/Performance.tsx`

1. **Payment Split colors** (line 100-104): Replace raw HSL with design tokens:
   - `paid` → `hsl(var(--success))` (emerald)
   - `partial` → `hsl(var(--warning))` (amber)
   - `pending` → `hsl(var(--destructive))` (red)

2. **Product Velocity bar** (line 699): Replace `hsl(38, 92%, 50%)` with `hsl(var(--primary))` — consistent navy blue matching Top Dealers chart.

3. **Sales Team Ranking bar** (line 743): Replace `hsl(262, 83%, 58%)` with `hsl(var(--primary))` — same navy blue for visual consistency across all bar charts.

4. **Top Dealers bar** (line 646): Already uses `hsl(var(--primary))` — no change needed.

## Result
All bar charts use the primary navy color; the donut chart uses semantic success/warning/destructive tokens. Unified, clean look matching the rest of the app.

