

# Fluent 2-Inspired Design System for Ledge

## Overview
Refine Ledge's existing token-based design system to align with Fluent 2's neutral-first color philosophy: lighter surfaces for hierarchy, restrained semantic accents, and systematic dark mode. No new features — purely CSS tokens and utility class updates.

## Key Fluent 2 Principles to Apply
- **Neutral foundation**: Backgrounds/surfaces use a layered neutral scale (not warm-tinted). Lighter = more prominent.
- **Restrained brand color**: Primary blue used only for CTAs, active states, and focus — never on large surfaces.
- **Semantic colors for feedback only**: Green/amber/red reserved for status, never decoration.
- **Subtle depth via elevation**: Cards use soft shadows that increase on hover, not color changes.
- **Dark mode**: Neutrals shift to cool grays (not purple-tinted), surfaces layer upward in lightness.

## Changes

### Pass 1: Token Foundation (`src/index.css`)
Realign CSS custom properties to a Fluent 2-inspired neutral scale:

**Light mode:**
- `--background`: Pure neutral `0 0% 97%` (Fluent Grey-98)
- `--foreground`: `0 0% 11%` (Fluent Grey-12)
- `--card`: `0 0% 100%` (white — elevated surface)
- `--card-foreground`: `0 0% 11%`
- `--popover`: `0 0% 100%`
- `--secondary`: `0 0% 96%` (Fluent Grey-96)
- `--muted`: `0 0% 94%` (Fluent Grey-94)
- `--muted-foreground`: `0 0% 44%` (Fluent Grey-44)
- `--border`: `0 0% 89%` (Fluent Grey-89)
- `--input`: `0 0% 89%`
- `--sidebar-*`: Align to same neutral scale
- `--surface`: `0 0% 100%`

**Dark mode:**
- `--background`: `0 0% 7%` (Fluent Grey-7 — cool, no purple tint)
- `--foreground`: `0 0% 93%`
- `--card`: `0 0% 10%` (elevated dark surface)
- `--secondary`: `0 0% 14%`
- `--muted`: `0 0% 14%`
- `--muted-foreground`: `0 0% 52%`
- `--border`: `0 0% 17%`
- `--sidebar-*`: Align accordingly

Keep `--primary`, `--success`, `--warning`, `--destructive` unchanged (already correct).

### Pass 2: Glass-card & Elevation (`src/index.css`)
Refine `.glass-card` shadow to use Fluent-style layered elevation:
- Light: `shadow-[0_1px_2px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)]` (softer, more natural)
- Dark: Add subtle `shadow-[0_1px_2px_rgba(0,0,0,0.2)]` instead of `shadow-none`
- Update `.card-hover` elevation to `shadow-[0_2px_8px_rgba(0,0,0,0.1)]`

### Pass 3: Status Badge Contrast (`src/components/ui/status-badge.tsx`)
Improve WCAG contrast ratios for status badges:
- Light mode: Use deeper background tints (e.g. `bg-emerald-100` not `/80`) and darker text (`text-emerald-800`)
- Dark mode: Increase text brightness (`text-emerald-300`, `text-amber-300`, etc.)

### Pass 4: Button & Input Refinement
- **`src/components/ui/button.tsx`**: No structural changes, just verify `rounded-lg` is consistent (already is)
- **`src/components/ui/input.tsx`**: Add `transition-colors` for smoother focus state

### Pass 5: Sidebar Polish (`src/components/layout/AppSidebar.tsx`)
- Active item indicator: Keep existing `bg-primary/[0.06]` pattern (already Fluent-aligned)
- Section labels: Already using correct muted style — no changes needed

### Pass 6: Toast/Sonner (`src/components/ui/sonner.tsx`)
- Already using glassmorphic backdrop-blur — keep as-is
- Verify semantic border colors are applied (already done)

## Files Changed
| File | Action |
|------|--------|
| `src/index.css` | Realign all tokens to Fluent 2 neutral scale, refine glass-card/card-hover shadows |
| `src/components/ui/status-badge.tsx` | Improve contrast ratios |
| `src/components/ui/input.tsx` | Add transition-colors |
| `mem://style/design-system` | Update memory with Fluent 2 alignment notes |

## What Does NOT Change
- All component behavior, data flow, routing
- Glassmorphic aesthetic (preserved, just systematized)
- Landing page tokens (separate namespace, untouched)
- Primary blue color (already set correctly)
- Font families, spacing scale, animations

