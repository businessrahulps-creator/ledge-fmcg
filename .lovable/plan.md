

# Implement All Audit Fixes (No Database)

Make the app fully functional with centralized mock data, proper validation, and polished UX — database connection deferred to later.

---

## Phase 1: Foundation — Centralized Data Store

**Why**: Every page has its own `useState` copy of mock data. Orders created on NewOrder don't appear on Orders or Dashboard. Editing on Orders doesn't reflect on Dashboard.

**Create `src/context/DataContext.tsx`**:
- React context holding all mutable state: `orders`, `distributors`, `salespersons`, `products`, `stockItems`, `godownLocations`
- Initialized from existing mock-data and godown-data
- Exposes mutation functions: `addOrder`, `updateOrder`, `addDistributor`, `updateDistributor`, `deleteDistributor`, `addSalesperson`, `updateSalesperson`, `deleteSalesperson`, `addProduct`, `updateProduct`, `deleteProduct`, `addStockItem`, `updateStockItem`, etc.
- Wrap `<App>` with `<DataProvider>`

**Update all pages** to use `useData()` hook instead of local `useState` from imports:
- `Dashboard.tsx` — read `orders`, `distributors`, `products` from context
- `Orders.tsx` — read/write `orders` from context
- `NewOrder.tsx` — call `addOrder()` from context
- `Distributors.tsx` — read/write `distributors` from context
- `Salespersons.tsx` — read/write `salespersons` from context
- `Stock.tsx` — read/write `products`, `stockItems`, `locations` from context
- `Reports/*.tsx` — read from context

---

## Phase 2: New Order Actually Works

**`src/pages/NewOrder.tsx`**:
1. Track `selectedDealer`, `selectedSalesperson`, `orderDate`, `dispatchDate`, `vehicle`, `driverName`, `remarks` in state (currently uncontrolled inputs)
2. Add validation before save:
   - Dealer required
   - At least 1 product line with a selected product and qty > 0
   - Show toast errors for missing fields
3. On save: construct a proper `Order` object with auto-generated `orderNumber` (e.g., `ORD-2026-009`), call `addOrder()` from DataContext
4. Fix `lineCounter` — replace module-level `let` with `useRef` or `crypto.randomUUID()`
5. Keep confetti + success overlay, but only fire after validation passes

---

## Phase 3: Dashboard Improvements

**`src/pages/Dashboard.tsx`**:
1. Remove hardcoded KPI percentage strings (`"+12%"`, `"+8%"`, etc.) — just show the values without fake trend data
2. Add `aria-label` to day-of-week buttons: `aria-label={["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][i]}`
3. Read data from `useData()` context

---

## Phase 4: Form Validation Across All Pages

**Distributors.tsx**:
- Require `name` (non-empty)
- Validate `contact` is non-empty
- Show toast or inline error if validation fails

**Salespersons.tsx**:
- Require `name`, `phone`, `region`
- Basic email format check if provided
- Show toast if validation fails

**Stock.tsx (Products)**:
- Require `name`, `sku`, `basePrice > 0`
- Show validation feedback

**Stock.tsx (Add Stock)**:
- Require qty > 0, show toast if not

---

## Phase 5: Quick Wins & Cleanup

1. **Delete `src/App.css`** — unused Vite boilerplate, no imports reference it
2. **Fix Signup link** — `src/pages/Signup.tsx` line 73: change `<Link to="/">` to `<Link to="/login">`
3. **Add Error Boundary** — Create `src/components/ErrorBoundary.tsx`, wrap app in it. Shows a friendly "Something went wrong" screen instead of white page on crash
4. **Login form functional flow** — Make login button navigate to `/dashboard` (keep as mock auth for now, real auth later). Currently works via `<Link>` wrapping the button, which is fine
5. **Fix dark mode status badges** — Add `dark:` variants to `StatusBadge` and `HealthBadge` colors (e.g., `dark:bg-emerald-500/20`)

---

## Files Changed

| File | Action |
|------|--------|
| `src/context/DataContext.tsx` | **New** — centralized data store |
| `src/components/ErrorBoundary.tsx` | **New** — error boundary |
| `src/App.tsx` | Wrap with DataProvider + ErrorBoundary |
| `src/App.css` | **Delete** |
| `src/pages/Dashboard.tsx` | Use context, remove fake %, add aria-labels |
| `src/pages/NewOrder.tsx` | Add validation, controlled inputs, persist order, fix lineCounter |
| `src/pages/Orders.tsx` | Use context instead of local state |
| `src/pages/Distributors.tsx` | Use context, add validation |
| `src/pages/Salespersons.tsx` | Use context, add validation |
| `src/pages/Stock.tsx` | Use context, add validation |
| `src/pages/Signup.tsx` | Fix link to `/login` |
| `src/pages/Reports.tsx` + report components | Use context |
| `src/components/ui/status-badge.tsx` | Add dark mode variants |

No new dependencies. No database. All data stays in-memory via React context — ready to swap for Supabase later by replacing context internals with React Query + Supabase client.

