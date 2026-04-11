

# End-to-End QA, CTO Review, UI/UX Audit & Production Readiness Plan

## Audit Findings

### Critical (Must fix before launch)

**C1. Console error: DialogFooter ref warning in Orders page**
The `DialogFooter` component is a plain function component (not wrapped in `forwardRef`), but Radix is trying to pass a ref to it. This produces a React warning in the console on every order detail dialog open.
- **Fix**: Wrap `DialogFooter` in `React.forwardRef` in `src/components/ui/dialog.tsx`

**C2. Missing `aria-describedby` on Dialog in Orders page**
Console warning: "Missing `Description` or `aria-describedby={undefined}` for {DialogContent}". The order detail dialog has no `DialogDescription`, violating accessibility.
- **Fix**: Add a visually hidden `DialogDescription` to the order detail dialog in `src/pages/Orders.tsx`

**C3. `updateOrder` stale closure over `orders` array**
In `DataContext.tsx` line 641, `updateOrder` uses `orders` from closure but only has `[orders, companyId, deductStockForOrder]` deps. Since `orders` changes on every state update, this creates unnecessary re-renders. More critically, the stock deduction check uses `currentOrder` from potentially stale `orders`.
- **Fix**: Use functional updater pattern and `useRef` for orders to avoid stale closure

### High (Should fix)

**H1. No loading/disabled state on Save Changes button in order detail dialog**
When saving order updates (which involve DB calls for stock deduction), the save button has no loading state. User can double-click.
- **Fix**: Add `isSaving` state to order save flow in `Orders.tsx`

**H2. Salesperson field not required in New Order form**
A salesperson can be left blank, which creates orders with empty `salesperson` field. This breaks sales team reports and performance analytics.
- **Fix**: Add validation requiring salesperson selection in `NewOrder.tsx`

**H3. `animate-stagger-fade` CSS class referenced but not defined**
`AppLayout.tsx` line 169 uses `animate-stagger-fade` class which is not defined in `index.css` or `tailwind.config.ts`. This is a no-op class.
- **Fix**: Either define the animation or remove the class

**H4. No empty state feedback when team tab loads with no members on Settings**
If `teamLoading` is true but resolves to 0 members (edge case for new company before seed), the empty state shows but could be clearer.

**H5. Distributor PDF export in profile dialog doesn't include company info**
Line 300 in `Distributors.tsx`: `companyName: ""` is passed to `ReportPdf`, meaning the dealer profile PDF has no company branding.
- **Fix**: Pass `api.companyInfo.name` to the dealer profile PDF

### Medium (Polish)

**M1. Inconsistent button height in New Order form**
Dealer select is `h-11` while other selects are `h-10`. The total display div is `h-11` on mobile but other inputs are `h-10`.
- **Fix**: Standardize to `h-10 md:h-12` consistently

**M2. `statusColors` defined but unused in Orders.tsx and NewOrder.tsx**
Both files define local `statusColors` maps that are not used by `StatusBadge` (which has its own internal styles). Dead code.
- **Fix**: Remove unused `statusColors` from both files

**M3. Missing `key` on the `<span>` elements in order dialog footer**
Lines 512, 526, 542 have `<span >` with trailing space — minor but sloppy.
- **Fix**: Clean up whitespace

**M4. `LiveClock` component updates every second**
This causes unnecessary re-renders of the entire header every second. For a production app, this is a performance concern on lower-end mobile devices.
- **Fix**: Wrap `LiveClock` in `React.memo` (likely already done, just verify)

**M5. No `rel="noopener noreferrer"` on WhatsApp share link**
The `window.open(url, "_blank")` call in Orders.tsx doesn't set `noopener` — minor security concern.
- **Fix**: Add `noopener,noreferrer` to window.open

**M6. Settings page Install App card only shows on mobile (`md:hidden`)**
Desktop users who haven't installed the PWA see the Install App button in the header but not the detailed card with iOS instructions. This is acceptable but worth noting.

## Implementation Order

1. **C1 + C2**: Fix DialogFooter forwardRef + add DialogDescription (2 files)
2. **C3**: Fix stale closure in updateOrder (1 file)  
3. **H1**: Add save loading state to order detail (1 file)
4. **H2**: Add salesperson validation to New Order (1 file)
5. **H3**: Remove undefined `animate-stagger-fade` class (1 file)
6. **H5**: Fix dealer profile PDF company name (1 file)
7. **M2**: Remove unused `statusColors` (2 files)
8. **M5**: Add noopener to WhatsApp share (1 file)
9. **M1 + M3**: Clean up button heights and whitespace (2 files)

## Files Changed

| File | Changes |
|------|---------|
| `src/components/ui/dialog.tsx` | Wrap `DialogFooter` in `forwardRef` |
| `src/pages/Orders.tsx` | Add `DialogDescription`, save loading state, remove unused `statusColors`, fix whitespace, add noopener |
| `src/pages/NewOrder.tsx` | Add salesperson validation, remove unused `statusColors`, fix select height |
| `src/context/DataContext.tsx` | Fix `updateOrder` stale closure with refs |
| `src/components/layout/AppLayout.tsx` | Remove `animate-stagger-fade` |
| `src/pages/Distributors.tsx` | Pass company name to profile PDF |

## What Does NOT Change
- All existing functionality, data flow, routing, and component behavior
- Design tokens, colors, spacing, glassmorphic aesthetic
- Database schema, RLS policies, edge functions
- Landing page, auth flow, PWA configuration

