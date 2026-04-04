

# Order Prefix Feature in Settings

## Overview
Add a configurable order prefix to Settings → Company tab, stored in DataContext. The prefix feeds into order number generation. Existing orders are never mutated.

## Changes

### 1. `src/context/DataContext.tsx`
- Add two new state fields: `orderPrefix` (string, default `"ORD"`) and `orderSequence` (number, initialized from max existing order sequence + 1)
- Add `setOrderPrefix(prefix: string)` and expose `orderPrefix` + `orderSequence` on context
- Update `nextOrderNumber()` to return `${orderPrefix}-${year}-${padded sequence}` and increment `orderSequence`
- The regex for initial sequence extraction stays, but only runs once to seed the counter

### 2. `src/services/api.ts`
- Expose `orders.prefix()` → returns current prefix
- Expose `orders.setPrefix(p: string)` → calls context setter
- Expose `orders.previewNumber()` → returns what next order number would look like (for the badge)

### 3. `src/pages/Settings.tsx`
- Add `orderPrefix` state (local, initialized from context via `useApi`)
- Add "Order Prefix" text input below Company Name: max 10 chars, auto-uppercase, helper text as specified
- Add `showPrefixConfirm` state for the confirmation dialog
- On "Save Changes" click: if prefix changed, show confirmation AlertDialog with the exact warning text. On confirm, call `api.orders.setPrefix()` then save. If prefix unchanged, save directly.
- The confirmation dialog shows current→new example using actual next sequence number

### 4. `src/pages/NewOrder.tsx`
- Add a read-only badge at the top (below the back button / title area) showing "Order Number Preview: [PREFIX]-2026-XXXX" using `api.orders.previewNumber()`
- Styled as a subtle `glass-card` inline badge with `text-xs text-muted-foreground`

## File Summary
| Action | File |
|--------|------|
| Edit | `src/context/DataContext.tsx` — add prefix state, sequence counter, updated nextOrderNumber |
| Edit | `src/services/api.ts` — expose prefix/setPrefix/previewNumber |
| Edit | `src/pages/Settings.tsx` — prefix input + confirmation dialog |
| Edit | `src/pages/NewOrder.tsx` — order number preview badge |

