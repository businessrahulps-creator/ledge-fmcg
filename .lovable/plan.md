

# Fix Report Section Mobile Overflow Issues

## Problems found
From testing at 390px viewport:
1. **Dialog tables cramped**: Tables inside detail dialogs have 4 columns with `px-3` padding — order numbers like "ORD-2026-001" wrap mid-word on small screens
2. **Dialog padding too wide**: Base DialogContent has `p-6` which eats into the available space on mobile; report dialogs use `max-w-[calc(100vw-2rem)]` but inner padding is still 24px per side = 48px lost
3. **Dispatch mobile cards**: Subtitle line crams dealer name + dispatch date + vehicle number into one line, causing text overflow
4. **Dialog inner table wrapper**: No horizontal scroll fallback — if content overflows, it breaks the layout

## Fixes (5 files)

### All 5 report dialogs — shared pattern
- Change `DialogContent` padding: add `p-4 md:p-6` to reduce mobile padding
- Wrap all `<table>` sections inside dialogs with `overflow-x-auto` so they scroll horizontally if needed
- Reduce mobile table cell padding from `px-3` to `px-2`
- Truncate long text in table cells with `truncate max-w-[100px]` on mobile for order numbers and dealer names

### `DispatchReport.tsx` — mobile card fix
- Split the long subtitle into two lines: line 1 = dealer + date, line 2 = vehicle number
- Prevents horizontal overflow on the card entries

### `PaymentReport.tsx` — line items table
- Same table padding and overflow-x-auto fixes

### `ProductReport.tsx` — orders table
- Same table padding and overflow-x-auto fixes

### `DistributorReport.tsx` — orders table
- Same table padding and overflow-x-auto fixes

### `SalesTeamReport.tsx` — orders table
- Same table padding and overflow-x-auto fixes

## Technical detail
- All `<div className="rounded-lg border border-border overflow-hidden">` wrapping tables become `<div className="rounded-lg border border-border overflow-x-auto">` 
- Table `<th>` and `<td>` padding changes from `px-3 py-2` to `px-2 py-2 md:px-3` on mobile
- DialogContent gets `p-4 md:p-6` added to className alongside existing overrides

