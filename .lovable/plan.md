

# Add Subtle Hover Interactions — All Pages

## Philosophy

No bouncy transforms, no color shifts, no "AI slop." Just two refined patterns used consistently:

1. **Table rows**: Soft background tint on hover + action buttons fade in. Already partially done — just needs consistency and a subtle left-border accent on hover.
2. **Cards**: Micro-lift (`translateY(-1px)`) + border darkens slightly + shadow deepens. No scale transforms. 200ms `ease-out`. On mobile, `active:scale-[0.98]` for touch feedback only.

These are the same patterns Linear, Stripe, and Vercel use — understated, functional, never decorative.

## What Changes

### `src/index.css` — Add two reusable utility classes

```css
.row-hover {
  @apply transition-all duration-200 ease-out hover:bg-muted/40;
}

.card-hover {
  @apply transition-all duration-200 ease-out 
         hover:-translate-y-[1px] hover:shadow-md hover:border-border/80
         active:scale-[0.98] active:shadow-sm;
}
```

This keeps the interaction layer in CSS utilities rather than scattered inline classes. Every page just applies `.card-hover` or `.row-hover`.

### Pages updated (hover classes consolidated)

| Page | Element | Current | New |
|---|---|---|---|
| **Dashboard** | KPI cards | No hover | `card-hover` |
| **Dashboard** | Distributor/Product section cards | No hover | `card-hover` |
| **Dashboard** | Recent order rows (desktop) | `hover:bg-muted/30` | `row-hover` |
| **Dashboard** | Recent order cards (mobile) | No hover | `card-hover` |
| **Orders** | Table rows | `hover:bg-muted/30` | `row-hover` |
| **Orders** | Mobile cards | `active:bg-muted/30` | `card-hover` |
| **Products** | Table rows | `hover:bg-muted/30` | `row-hover` |
| **Products** | Mobile cards | No hover | `card-hover` on each item row |
| **Distributors** | Cards | `hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg` | `card-hover` (refined, less aggressive) |
| **Salespersons** | Cards | Same as distributors | `card-hover` |
| **GodownOverview** | Location cards | `hover:border-primary/40 hover:-translate-y-0.5` | `card-hover` |
| **GodownOverview** | KPI cards | No hover | `card-hover` |
| **GodownInventory** | Table rows | `hover:bg-muted/20` | `row-hover` |
| **GodownInventory** | Mobile cards | `active:bg-muted/20` | `card-hover` |
| **GodownAlerts** | Alert cards | No hover | `card-hover` |
| **Reports** (all 4) | Table rows | `hover:bg-muted/30` | `row-hover` |
| **Reports** (all 4) | Mobile cards | No hover | `card-hover` |
| **Settings** | Team member rows | No hover | `row-hover` |

### Report components (4 files)
- `DistributorReport.tsx`, `ProductReport.tsx`, `PaymentReport.tsx`, `DispatchReport.tsx` — swap inline `hover:bg-muted/30` on `<tr>` to `row-hover`, add `card-hover` to mobile card divs.

### What does NOT change
- No new dependencies. No framer-motion additions. Pure CSS.
- Landing page untouched.
- Button hover states stay as-is (handled by shadcn).
- Dialog/modal content stays as-is.

## Files touched: ~13
`index.css` + `Dashboard` + `Orders` + `Products` + `Distributors` + `Salespersons` + `GodownOverview` + `GodownInventory` + `GodownAlerts` + `Settings` + 4 report components

