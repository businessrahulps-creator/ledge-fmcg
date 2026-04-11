

# Final QA & Production Readiness Plan

## Audit Findings

### Critical

**C1. Missing `DialogDescription` on all non-Orders `Dialog` components**
Console warning persists: "Missing `Description` or `aria-describedby`" for `DialogContent`. The Orders page was fixed but the following pages still have `Dialog` components without `DialogDescription`:
- `Distributors.tsx`: Add/Edit dialog (line 227), Dealer Profile dialog (line 273)
- `Stock.tsx`: Add/Edit Product dialog, Add/Edit Warehouse dialog, Edit Stock Item dialog, Add Stock dialog
- `Salespersons.tsx`: Add/Edit dialog
- `Settings.tsx`: Add/Edit Team Member dialog, Logo upload dialog

**Fix**: Add `<DialogDescription className="sr-only">...</DialogDescription>` to every `Dialog` that lacks one. Import `DialogDescription` where missing.

### High

**H1. Inconsistent input heights in Orders detail dialog**
Dispatch fields (lines 483, 492, 499) use `h-11` while other inputs and selects use `h-10`. In `NewOrder.tsx`, the total display div uses `h-11` (line 350) while sibling inputs use `h-10`.
**Fix**: Standardize to `h-10` base, `md:h-12` for desktop across all inputs in both files.

**H2. `statusColors` map is defined but previous audit incorrectly flagged it as unused**
Both `Orders.tsx` and `NewOrder.tsx` actively use `statusColors` for the toggle button styling. No action needed — this was a false positive from the previous audit. Confirming here for accuracy.

### Medium

**M1. ExportPdfModal missing `DialogDescription`**
Check if the PDF export modal also triggers the warning.

## Implementation Plan

1. Add `DialogDescription` (visually hidden) to all `Dialog` components across `Distributors.tsx`, `Stock.tsx`, `Salespersons.tsx`, `Settings.tsx`
2. Fix input height inconsistencies in `Orders.tsx` detail dialog (`h-11` → `h-10`) and `NewOrder.tsx` total display (`h-11` → `h-10`)
3. Check and fix `ExportPdfModal.tsx` if missing `DialogDescription`

## Files Changed

| File | Changes |
|------|---------|
| `src/pages/Distributors.tsx` | Add `DialogDescription` import + sr-only instances |
| `src/pages/Stock.tsx` | Add `DialogDescription` import + sr-only instances |
| `src/pages/Salespersons.tsx` | Add `DialogDescription` import + sr-only instances |
| `src/pages/Settings.tsx` | Add `DialogDescription` import + sr-only instances |
| `src/components/pdf/ExportPdfModal.tsx` | Add `DialogDescription` if missing |
| `src/pages/Orders.tsx` | Fix `h-11` → `h-10` on dispatch inputs |
| `src/pages/NewOrder.tsx` | Fix `h-11` → `h-10` on total display div |

## What Does NOT Change
- All existing functionality, data flow, routing, and component behavior
- Design tokens, colors, glassmorphic aesthetic
- Database schema, RLS policies, edge functions

