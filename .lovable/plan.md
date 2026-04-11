

# Comprehensive UI/UX Stress-Test Audit & Polish Plan

## Fresh Audit Findings

### 1. BUTTONS — Inconsistent sizing and weight
- **Default button height is h-12 (48px)** — too tall for secondary/toolbar actions. Creates visual bloat.
- `size="sm"` is h-9 (36px) — fine for inline, but inconsistent with the h-11/h-12 inputs next to them in filter rows.
- Action button rows (Orders, Dealers, Stock, Salespersons) use `flex-1 sm:flex-none` but no consistent height class — some get h-12 default, some h-11.
- "New Order" button on Orders page is wrapped in `<Link><Button>` causing potential double-wrap sizing issues.
- Dialog footer buttons inconsistent — some use `size="sm"`, some default.
- The `active:scale-[0.98]` only on default and outline variants — should be on all interactive variants.

### 2. SIDEBAR — Thin text, weak active state
- Nav items use `font-semibold` (600) which is actually fine weight, but the active state (`bg-sidebar-accent`) lacks visual punch — no left indicator, no color accent, just a grey background.
- Section labels `text-muted-foreground/60` are too faint — nearly invisible.
- Collapsed state icon containers (h-9 w-9) are good but labels below (`text-[10px]`) may be too small.

### 3. MOBILE BOTTOM NAV — Solid but could be sharper
- Nav pill animation is good. Icon size (22px) and labels (11px) are appropriate.
- The "More" dropdown works but could show which sub-page is active more clearly.

### 4. KPI CARDS — Revenue overflow risk
- Revenue value uses `whitespace-nowrap` which is correct, but `text-lg sm:text-xl md:text-2xl` may overflow on mobile for large Indian currency values (e.g., ₹12,34,56,789). The `min-w-0` is set but no `overflow-hidden` or `text-ellipsis`.
- KPI labels are `text-[11px]` — could be `text-xs` for consistency.
- No accent color differentiation between KPIs — all look identical.

### 5. COLOUR PALETTE — Too flat, lacks depth
- Light theme is purely greyscale (`primary: 0 0% 7%` = near-black). No accent color in the app chrome at all.
- Progress bars in Top Dealers/Products use `bg-foreground/25` — very faint, barely visible.
- Day selector active state `bg-foreground/85` is stark black — feels harsh.
- No subtle warm or cool tint to surfaces — feels clinical and lifeless.

### 6. PDF INVOICE
- Uses `formatCurrencyPdf` with "Rs." prefix instead of ₹ — this is intentional for Helvetica compatibility but could note this.
- Table header is `#1A1A1A` (near-black) — very heavy. A softer header would feel more professional.
- Grand total box uses inline styles with hardcoded colors — should use consistent styling.
- Overall PDF is functional but heavy/corporate rather than modern/lightweight.

### 7. ANIMATIONS
- Dashboard KPI cards have good staggered spring animation.
- Order cards alternate between y and x translations — cute but slightly disorienting.
- `animate-stagger-fade` on main content wrapper is subtle and nice.
- Missing: no page transition animation between routes, no skeleton-to-content crossfade.

### 8. FORMS & INPUTS
- Input height h-10 default but overridden to h-12 in forms — inconsistent.
- Select triggers sometimes h-11, sometimes h-12.
- Form labels inconsistent — some `text-xs`, some `text-sm`, some `text-xs md:text-sm`.

### 9. TABLES
- Table header inconsistency: Dashboard uses `bg-muted/40`, Orders uses `bg-muted/30`.
- Row padding is generous (px-6 py-4) which is good for touch.
- No hover state differentiation beyond `row-hover` (bg-muted/40).

### 10. DIALOGS
- Order detail dialog `max-w-[calc(100vw-2rem)]` is good for mobile.
- Dialog content sometimes lacks consistent padding between sections.

### 11. EMPTY STATES
- Orders empty state is well-designed with icon + text + CTA.
- Dashboard "no orders on [day]" empty state is also good.
- Need to verify all list pages have good empty states.

### 12. PWA INSTALL
- Already implemented with contextual prompts, desktop header button, Settings card, and milestone tracking. This is solid.

---

## Improvement Plan

### Pass 1: Design Tokens & Colour System
**Files: `src/index.css`**
- Add a subtle indigo/blue accent to the light theme primary (`--primary: 224 60% 20%` or similar) to break the flat B&W.
- Warm up `--background` slightly (add a tiny warm tint).
- Strengthen `--muted-foreground` for better readability.
- Add `--accent-subtle` token for KPI card differentiation.

### Pass 2: Button Consistency
**Files: `src/components/ui/button.tsx`**
- Reduce default height from h-12 to h-10 (standard).
- Make `sm` h-8, `lg` h-12.
- Add `active:scale-[0.98]` to all interactive variants.
- Ensure consistent border-radius across all sizes.

### Pass 3: Sidebar Active State
**Files: `src/components/layout/AppSidebar.tsx`**
- Add a left accent bar (3px rounded) on active items.
- Increase section label opacity from `/60` to `/80`.
- Use `font-medium` (500) for inactive items, `font-semibold` (600) for active.

### Pass 4: KPI Cards Polish
**Files: `src/pages/Dashboard.tsx`**
- Add `overflow-hidden text-ellipsis` to revenue value as safety.
- Add subtle left-border accent colors to each KPI (emerald for revenue, blue for orders, amber for pending, indigo for dispatched).
- Standardize label sizes to `text-xs`.

### Pass 5: Progress Bars & Visual Depth
**Files: `src/pages/Dashboard.tsx`**
- Change progress bar fill from `bg-foreground/25` to a proper subtle color (`bg-primary/40`).
- Soften day selector active state to use primary color instead of black.

### Pass 6: Table Header Consistency
**Files: `src/pages/Dashboard.tsx`, `src/pages/Orders.tsx`**
- Standardize all table headers to `bg-muted/30`.

### Pass 7: Form Input Height Consistency
**Files: `src/components/ui/button.tsx`, various pages**
- Standardize: inputs h-10, selects h-10, buttons h-10 (default) to align in rows.
- Filter rows: inputs and selects both h-10.

### Pass 8: PDF Modernization
**Files: `src/components/pdf/PdfStyles.ts`**
- Lighten table header from `#1A1A1A` to `#374151` (softer dark grey).
- Add rounded corners feel with subtle cell padding increase.
- Refine summary card styling for a cleaner, lighter look.

### Pass 9: Mobile Order Card Animation
**Files: `src/pages/Dashboard.tsx`**
- Simplify order card animation — remove alternating x/y translation, use consistent subtle y-offset fade-in.

### Pass 10: Dialog & Form Polish
- Ensure consistent label sizes and spacing across all dialogs.
- Add subtle section separators in complex dialogs.

### Technical constraints
- All changes use existing Tailwind + shadcn/ui.
- No new dependencies.
- All existing classNames, component props, and data flows preserved.
- Changes are purely visual — no logic changes.

