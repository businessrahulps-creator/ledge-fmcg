

# Fix Orders Page — Match Premium Design System

## Issues Found

1. **Blue "New Order" button** — `--primary` CSS var is still `224 100% 62%` (blue). The button uses `bg-primary`, which renders blue. Since the design system's primary action color should be black, we need to update `--primary` to near-black (`0 0% 7%`) in the light theme CSS vars. This also fixes order numbers showing in blue (`text-primary`).

2. **Distributor names too large on mobile cards** — The mobile card view uses `text-sm` for distributor names, but the order number row is `text-sm font-medium` which combined with the overall spacing makes everything feel oversized. Need to tighten the card layout.

3. **`--primary` change has cascading impact** — Since `--primary` drives buttons, links, active nav states, and accent colors globally, changing it to black means we also need to update `--accent` (used for hover states) to stay distinguishable, and ensure the sidebar active state still looks good.

## Changes

### `src/index.css`
- `:root` — `--primary: 224 100% 62%` → `--primary: 0 0% 7%` (near-black)
- `:root` — `--accent: 224 100% 62%` → `--accent: 0 0% 95%` (light gray for hover backgrounds)
- `:root` — `--accent-foreground: 0 0% 100%` → `--accent-foreground: 0 0% 7%`
- `:root` — `--ring: 224 100% 62%` → `--ring: 0 0% 7%`
- `:root` — `--sidebar-primary: 224 100% 62%` → `--sidebar-primary: 0 0% 7%`
- `:root` — `--sidebar-ring: 224 100% 62%` → `--sidebar-ring: 0 0% 7%`
- Keep `--primary-foreground: 0 0% 100%` (white text on black button — correct)

### `src/pages/Orders.tsx`
- **Mobile cards**: Reduce order number to `text-xs`, distributor name to `text-[11px]`, tighten padding from `py-3` → `py-2.5`
- **Order number color**: Change `text-primary` → `text-[#111]` (since primary is now black, this is fine either way, but explicit is cleaner)
- **Desktop table**: Order number `text-primary` is fine as black

### What stays the same
- All other pages — they use `bg-[#111]` or explicit colors, not `text-primary`, so they're unaffected
- Landing page — has its own dark overrides
- Status badges — already using explicit emerald/amber/red colors

