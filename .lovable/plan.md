

# Google Material Design 3 + Linear Hybrid — Fresh UI/UX Audit & Polish Plan

## Audit Summary

After thoroughly examining every page on desktop (1280px) and mobile (390px), the app is already in **solid 7/10 territory**. The previous passes fixed the most critical mobile overflow issues, added KPI accent borders, sidebar active indicators, and standardized button heights. Here is what remains:

### What's Already Good
- Sidebar active state with left accent bar and primary color — clean, clear
- Mobile bottom nav with pill animation — polished
- KPI cards with color-coded left borders — effective visual hierarchy
- Icon-only export buttons on mobile — no more text clipping
- Day selector using primary color — consistent
- Order cards, table layouts, and status badges — well-structured
- Overall spacing and typography hierarchy — comfortable

### Remaining Issues Found

**1. New Order form — Payment Mode buttons inconsistent with rest of app**
The payment mode and status toggle buttons use a custom pill style with borders that feels disconnected from the rest of the UI. The "Pending" payment status button uses a red outline that's very prominent. These should feel more like segmented controls.

**2. Progress bars too faint**
Top Dealers and Top Products progress bars use `bg-primary/30` which is very subtle on light backgrounds. Needs slightly more opacity (40-50%) to be readable.

**3. Reports page — Export buttons not icon-only on mobile**
The Reports page uses full-text export buttons that will likely overflow on narrow screens, same pattern that was already fixed on other pages.

**4. "1 orders" grammatical issue on dealer cards**
Dealer cards show "1 orders" instead of "1 order" — minor but noticeable for quality feel.

**5. Glass card shadow could be subtler on mobile**
The `glass-card` shadow is fine on desktop but on mobile cards that stack vertically, the shadows create visual noise. A slightly lighter shadow on mobile would feel calmer.

**6. Login/Signup pages — not audited via browser but should verify dot-grid background alignment**

**7. PDF table header already fixed to `#374151`** — this is good and professional now.

---

## Improvement Plan

### Pass 1: Reports page — Icon-only export buttons on mobile
**File:** `src/pages/Reports.tsx`  
Apply the same `hidden sm:inline` label pattern used on Orders, Dealers, Stock pages.

### Pass 2: Progress bar visibility improvement
**File:** `src/pages/Dashboard.tsx`  
Change progress bar fill from `bg-primary/30` to `bg-primary/50` for better visibility.

### Pass 3: Grammar fix — "1 orders" → "1 order"
**File:** `src/pages/Distributors.tsx`  
Use conditional pluralization for order count display.

### Pass 4: New Order payment buttons — subtle refinement
**File:** `src/pages/NewOrder.tsx`  
Minor refinement: reduce border width visual weight on payment toggle buttons to feel more cohesive with the glass-card aesthetic.

### Hybrid Role Comparison Note
A Material Design 3-only approach would push toward filled/tonal button segmented controls and more elevation layering. A Linear-only approach would keep everything extremely flat. The hybrid recognizes: (a) the existing glass-card system is already premium and consistent — no need to add MD3 elevation tokens, (b) the sidebar active state is already Linear-quality, (c) the mobile nav pill is already iOS-quality. The main wins from this hybrid lens are the **small consistency gaps** (Reports exports, progress bar contrast, grammar) rather than wholesale aesthetic changes.

### Technical Constraints
- Tailwind + shadcn/ui only, no new dependencies
- All existing classNames and behavior preserved
- Purely visual/text fixes, no logic changes

