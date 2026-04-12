

# Final Visual & UI/UX Refinement Plan

## Fresh Audit Findings

The tokens and glass-card system are already in good shape from previous passes. What remains are **consistency gaps** — places where old saturated badge colors (`bg-*-100 text-*-800`) were missed during the enterprise palette standardization.

### Issues Found

| # | Priority | File | Issue |
|---|----------|------|-------|
| 1 | High | `src/pages/Orders.tsx` | `getOrderBillingStatus` uses old `bg-*-100 text-*-800` for GST Invoice, Proforma, Estimate badges (lines 55-62) |
| 2 | High | `src/pages/OrderDetail.tsx` | Invoice status badges use old `bg-emerald-100 text-emerald-800` / `bg-amber-100 text-amber-800` (line 618) |

These are the only remaining inconsistencies with the design system. The token layer, glass-card elevation, shadows, typography, button system, sidebar, mobile nav, and status badges are all already aligned.

## Implementation Plan

### Pass 1: Standardize Orders.tsx billing status badges

**File:** `src/pages/Orders.tsx` (lines 55-62)

Replace all `bg-*-100 text-*-800` with `bg-*-50/80 text-*-700` to match `status-badge.tsx` and the Claims/Billing pages:

- `bg-emerald-100 text-emerald-800` → `bg-emerald-50/80 text-emerald-700`
- `bg-amber-100 text-amber-800` → `bg-amber-50/80 text-amber-700`
- `bg-purple-100 text-purple-800` → `bg-purple-50/80 text-purple-700`

### Pass 2: Standardize OrderDetail.tsx invoice status badges

**File:** `src/pages/OrderDetail.tsx` (line 618)

Same pattern replacement for the inline badge colors.

---

**2 files, 6 line edits. Pure color token alignment. No layout, behaviour, or component changes.**

