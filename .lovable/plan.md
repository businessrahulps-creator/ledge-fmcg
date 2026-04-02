

# Fix Reports Tab Inconsistencies

## Issues Found

Auditing the four report tabs reveals these inconsistencies:

1. **Summary stats bar** — Distributor/Product/Payment wrap stats in a `flex` div with `text-xs md:text-sm`. Dispatch has a bare `<span>` with `text-xs md:text-sm` outside any wrapper, breaking alignment when filters stack on mobile.

2. **Mobile card structure** — Distributor and Product cards are clean 2-line layouts. Payment and Dispatch add a third line using `text-[10px]` which feels smaller and inconsistent with the `text-xs` used elsewhere.

3. **Order number color** — Payment and Dispatch mobile cards use `text-primary` for order numbers. Since primary is now black and matches `text-foreground`, this is functionally fine but should be explicit `text-foreground` for clarity and consistency with Distributor/Product which use no color class.

4. **StatusBadge sizing** — Uses `rounded-pill` which isn't a standard Tailwind class (should be `rounded-full`). Also `px-3 py-1` feels large relative to the `text-xs` mobile cards.

## Changes

### `src/components/ui/status-badge.tsx`
- Fix `rounded-pill` to `rounded-full`
- Tighten to `px-2.5 py-0.5` for better proportion

### `src/components/reports/DispatchReport.tsx`
- Wrap summary count in the same `flex` div pattern used by other tabs
- Mobile cards: change `text-[10px]` to `text-xs` on the third line, merge dispatch date + vehicle into the secondary line (same `mt-0.5 text-xs text-muted-foreground` pattern)
- Order number: `text-primary` to `text-foreground`

### `src/components/reports/PaymentReport.tsx`
- Mobile cards: merge the third-line status + mode into the secondary `text-xs` line, or keep as a separate line but use `text-xs` not `text-[10px]`
- Order number: `text-primary` to `text-foreground`
- Status row: `mt-1.5` to `mt-1` for tighter spacing

### `src/components/reports/DistributorReport.tsx`
- No structural changes needed — already the cleanest. Just ensure mobile card name uses same weight as others.

### `src/components/reports/ProductReport.tsx`
- No structural changes needed — already consistent with Distributor.

### `src/pages/Reports.tsx`
- Page header: standardize `text-lg font-semibold` to match other pages' header sizing (currently `text-xl font-bold` which may differ from other pages)

**Result**: All four tabs will share identical typography scales (`text-xs` for secondary, `text-sm font-medium` for primary), identical summary bar structure, identical mobile card padding and line spacing, and a properly sized status badge.

