

# Fix: Order Detail Action Bar Hidden on Mobile

## Problem Found
The Order Detail page's sticky action bar (Delete, Invoice, WhatsApp, Save Changes) is **completely hidden behind the floating bottom navigation** on mobile.

- Action bar: `fixed bottom-0 z-40`
- Bottom nav: `fixed bottom-4 z-50` (floating pill, ~60px tall)

The action bar renders below the bottom nav and is invisible/inaccessible.

## Fix

| File | Change |
|------|--------|
| `src/pages/OrderDetail.tsx` | Change the action bar from `fixed bottom-0` to `fixed bottom-24 md:bottom-0` (or use `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`) so it floats above the bottom nav on mobile. Also match the rounded/glass styling of the nav for consistency. On `md:` and above, keep it `static` as currently designed. |

The existing `pb-24 md:pb-6` padding on the content wrapper already accounts for this bar, so no other changes needed.

### Single-line change
Line 486 — update the action bar container classes:
```
// Before
fixed bottom-0 left-0 right-0 z-40 ...

// After  
fixed bottom-[5.5rem] left-4 right-4 z-40 rounded-xl ...
```

This positions it just above the floating bottom nav (which sits at `bottom-4` with ~3.5rem height + padding).

No other pages are affected — DealerDetail and SalespersonDetail do not have fixed action bars.

## Everything Else Works
- Order detail page: all sections render correctly on both desktop and mobile
- Salesperson detail page: profile, scorecard, order history all functional
- Dealer detail page: code is sound (no dealers in DB to test live, but "not found" state works)
- Navigation from list to detail pages works correctly for all three entities
- Back buttons work
- No console errors related to the detail pages

