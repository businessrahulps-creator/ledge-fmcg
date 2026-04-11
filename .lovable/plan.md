

# Comprehensive UI/UX Polish Plan — Ledge 10/10 Elevation

## Audit Findings

### Critical Issues (User-Reported)
1. **Sidebar nav text too thin** — Currently `text-sm` with no explicit font-weight on the `<span>`. The `activeClassName="text-primary font-medium"` only applies on active state; inactive items have no weight class, defaulting to 400.
2. **Ugly left border-l-2 active indicator** — `border-l-2 border-primary` on active nav items creates a harsh black bar. Should be replaced with a subtle full-width rounded background pill (Linear-style).
3. **Revenue KPI overflow** — `formatCurrency(totalRevenue)` can produce long strings like `₹12,34,567.00`. The container uses `text-2xl md:text-3xl` with no overflow handling — breaks on narrow cards.
4. **Flat black-and-white palette** — The light mode uses `--primary: 0 0% 7%` (near-black) and `--background: 0 0% 98%` (near-white). No intermediate surface layers or subtle accent tones for depth.

### Secondary Findings
5. **Glass-card shadow too faint** — `shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)]` is nearly invisible.
6. **Progress bars blend in** — `bg-foreground/25` is too subtle against muted backgrounds.
7. **Table header row** lacks sufficient visual separation from data rows.
8. **Sidebar section labels** (`text-muted-foreground/50`) are nearly invisible.
9. **Day picker buttons** — active state `bg-foreground text-background` is stark; could use softer treatment.
10. **"View all →" links** — `text-muted-foreground/70` is too faint for an actionable element.

---

## Implementation Plan (7 Passes)

### Pass 1: Design Tokens — Depth & Warmth (`src/index.css`)
- Add a new `--surface-raised` token (`0 0% 100%` light, slightly lighter than card in dark) for cards that need lift
- Bump `--muted` from `0 0% 94%` to `0 0% 96%` for gentler backgrounds
- Upgrade `.glass-card` shadow to `shadow-[0_1px_6px_-1px_rgba(0,0,0,0.08),0_1px_2px_-1px_rgba(0,0,0,0.04)]` (layered, more realistic)
- Add `.glass-card:hover` subtle shadow lift for interactive cards
- Strengthen `.row-hover` to `hover:bg-muted/40`

### Pass 2: Sidebar Navigation (`src/components/layout/AppSidebar.tsx`)
- Change nav item text to `font-semibold` (weight 600) for all states
- **Remove** `border-l-2 border-primary` active indicator entirely
- Replace with a subtle rounded pill background: active items get `bg-sidebar-accent text-foreground font-semibold` with a smooth `rounded-lg` fill (Linear-style)
- Active icon gets `text-foreground` instead of `text-primary`
- Section labels: bump from `text-muted-foreground/50` to `text-muted-foreground/60`
- Settings footer nav: same treatment, remove border-l-2

### Pass 3: KPI Revenue Overflow Fix (`src/pages/Dashboard.tsx`)
- Add `truncate` or `text-[clamp(1.25rem,4vw,2.5rem)]` responsive sizing to KPI values
- Wrap KPI value in a container with `min-w-0 overflow-hidden`
- Use `tabular-nums` for consistent number width
- Reduce Revenue number font size on mobile to prevent overflow: `text-xl md:text-3xl`

### Pass 4: Palette Depth (`src/index.css`)
- Light mode: shift `--background` to `0 0% 97.5%` (slightly warmer)
- Add a subtle warm tint to `--card`: `40 20% 99%` (barely perceptible cream)
- Adjust `--border` to `0 0% 90%` for slightly more visible borders
- `--muted-foreground` stays at `0 0% 45%` but labels get bumped to `text-muted-foreground` (not `/60` or `/50`)
- Progress bar fills: change from `bg-foreground/25` to `bg-foreground/35` for visibility

### Pass 5: Interactive Polish
- Day picker active state: soften from pure `bg-foreground` to `bg-foreground/90`
- "View all →" links: bump to `text-muted-foreground hover:text-foreground` (drop the `/70`)
- Status toggle buttons in Orders dialog: ensure `active:scale-[0.97]` and `transition-all`

### Pass 6: Table Headers
- Already have `bg-muted/30` — bump to `bg-muted/40` for more separation
- Ensure `font-semibold` on all `<th>` elements across Dashboard, Orders, and dialog tables

### Pass 7: Auth Pages Consistency
- Login/Signup cards already have `shadow-sm backdrop-blur-sm` — keep as-is
- No changes needed here (already aligned from previous pass)

---

### Files Modified
- `src/index.css` — glass-card shadow, palette depth, progress bar visibility
- `src/components/layout/AppSidebar.tsx` — font-semibold nav text, remove border-l-2, pill active state
- `src/pages/Dashboard.tsx` — KPI overflow fix, progress bar contrast, link contrast

### What Will NOT Change
- All data flow, API calls, realtime subscriptions, RBAC
- All routing, auth, pagination, CSV/PDF export
- Indian date formatting, IST clock
- Dark mode token values (only light mode depth adjustments)
- Component structure, prop interfaces
- No icon library change (Lucide stays — Tabler would require dependency addition and is not worth the risk for a polish pass)

