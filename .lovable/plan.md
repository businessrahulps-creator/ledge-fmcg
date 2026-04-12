

# Fix Mobile UI Issues — Spacing, Cropping, and Billing Order Picker

## Issues Identified from Screenshots

| # | Issue | File | Root Cause |
|---|-------|------|------------|
| 1 | **Schemes: "Specific Product/Dealer (optional)" labels break on mobile** | `Schemes.tsx` L392 | Two `grid-cols-2` columns are too narrow at 320-375px for long labels + select dropdowns |
| 2 | **Stock: Warehouse inventory toolbar buttons overflow/disappear on mobile** | `Stock.tsx` L534 | `flex gap-2` with 4 buttons (search, CSV, PDF, Add Stock) — no wrapping, buttons fall off-screen |
| 3 | **OrderDetail: Action bar icons too close together** | `OrderDetail.tsx` L727 | `gap-2` on icons inside `flex` is fine, but the buttons have no min spacing on mobile — the delete/invoice/WhatsApp/claim icons are cramped |
| 4 | **DealerDetail: Export icons too close** | `DealerDetail.tsx` L84 | `gap-2` between WhatsApp and Statement buttons is tight at mobile |
| 5 | **Billing: Order picker Command list not scrollable / search broken** | `Billing.tsx` L627-694 | `CommandList` has `max-h-[300px]` which works, but the `PopoverContent` inside a `Dialog` with `max-h-[90vh] overflow-y-auto` creates nested scroll containers. The popover may be clipped by the dialog's overflow. Also the dialog itself is `max-w-3xl` without mobile-responsive width. |
| 6 | **Billing dialog not mobile-responsive** | `Billing.tsx` L567 | `max-w-3xl` without `max-w-[calc(100vw-2rem)]` — may crop on mobile |

## Implementation Plan

### Pass 1: Schemes — Stack product/dealer selects on mobile (`Schemes.tsx`)

- Line 392: Change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` so the two selects stack vertically on mobile

### Pass 2: Stock — Wrap inventory toolbar on mobile (`Stock.tsx`)

- Line 534: Change `flex gap-2` to `flex flex-wrap gap-2` so buttons wrap to next row
- On mobile, hide "Export CSV" and "Export PDF" text labels (already icon-only buttons with text, make text `hidden sm:inline`)

### Pass 3: OrderDetail — Add proper icon spacing (`OrderDetail.tsx`)

- Line 727: Increase icon button spacing from `gap-2` to `gap-2.5` in the action bar for better touch targets

### Pass 4: Billing dialog — Fix mobile width + order picker scrollability (`Billing.tsx`)

- Line 567: Add `max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-3xl` to DialogContent for mobile
- Line 627: Add `sideOffset={4}` and ensure PopoverContent has proper max-height
- Line 630: Add explicit `className="max-h-[40vh]"` to CommandList to ensure scrollability within the dialog

### Pass 5: Schemes validity dates — Stack on mobile (`Schemes.tsx`)

- Line 430: Change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` for validity date fields too (they share the same tight-column problem as product/dealer)

---

**4 files changed. ~10 line edits. Pure layout/spacing fixes. No behaviour or feature changes.**

