

# Mobile-First UI Fix Pass — Resolving Remaining Issues

## Problems Identified from Screenshot

### 1. Orders page: Action buttons overflow on mobile
The three buttons (Export CSV, Export PDF, New Order) sit in a single `flex` row with `flex-1 sm:flex-none`. On a 390px screen, "New Order" gets clipped to "New O..." because all three compete for space equally.

### 2. Filters stack vertically taking too much space
Search, Payment select, and Delivery select each occupy a full row on mobile — 3 separate full-width rows before any content appears. This pushes the actual order list far down.

### 3. Same pattern on Dealers, Sales Team, Stock pages
Action buttons use the same `flex gap-2 w-full` pattern and will clip text on narrow screens.

### 4. Stock page: Products tab has 4 buttons stacking poorly
Search, Add Product, Export CSV, Export PDF are in a `flex-col` on mobile — 4 full-width buttons before content.

---

## Fix Plan

### Fix 1: Compact mobile action bar on Orders
- On mobile, show only icon buttons for Export CSV and Export PDF (hide text labels below `sm`).
- Keep "New Order" as the only full-label button since it's the primary CTA.
- Use `size="icon"` variant below `sm` breakpoint via responsive classes, or use `<span className="hidden sm:inline">` for labels.

**Files:** `src/pages/Orders.tsx` (lines 180-223)

### Fix 2: Inline filters on mobile for Orders
- Put the two selects (Payment, Delivery) side by side in a single row on mobile using `grid grid-cols-2 gap-2`.
- Keep search full-width above them.
- This reduces 3 rows to 2 rows.

**Files:** `src/pages/Orders.tsx` (lines 227-258)

### Fix 3: Same icon-only pattern for Dealers & Sales Team
- Export CSV button: hide text label on mobile, show icon only.
- Primary CTA ("Add Dealer", "Add Member") keeps its label.

**Files:** `src/pages/Distributors.tsx` (lines 119-144), `src/pages/Salespersons.tsx` (lines 127-153)

### Fix 4: Stock page Products tab — compact action row
- Export CSV and Export PDF: icon-only on mobile.
- "Add Product" keeps label as primary CTA.
- Arrange in a single row with search below.

**Files:** `src/pages/Stock.tsx` (lines 302-348)

### Fix 5: Tighten vertical spacing on all list pages (mobile only)
- Reduce `space-y-4` to `space-y-3` on mobile header sections to reduce the gap before content.

**Files:** All affected pages

### Technical approach
- Use `<span className="hidden sm:inline">Label</span>` pattern for export button labels
- Use `size="icon"` class on mobile via `h-10 w-10 sm:h-10 sm:w-auto sm:px-5` or simply hide text
- No new dependencies, no logic changes, purely layout fixes

