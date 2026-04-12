

# Add "New Claim" Flow to Claims Page

## The Problem

Currently, claims can only be created from deep inside an Order Detail page (the "Return / Claim" button appears only on dispatched/delivered orders). Users landing on the Claims page have no way to create one — confusing for anyone who doesn't know the hidden path.

## Solution

Add a **"+ New Claim"** button to the Claims page header that opens a two-step modal:

1. **Step 1 — Pick an order**: Show a searchable list of dispatched/delivered orders (the only orders eligible for claims). Each row shows order number, dealer name, date, and amount.
2. **Step 2 — Fill in claim details**: Once an order is selected, show the same claim form already built in `OrderDetail.tsx` — claim type (Return vs Damage), reason, per-product quantities.

This reuses the exact same `api.claims.create()` logic and `Claim`/`ClaimLine` types. No new API surface needed.

## Design

- Button in the page header row, matching the pattern on Orders/Dealers/Stock pages
- Modal uses `Dialog` from shadcn/ui, glassmorphic styling
- Step 1: filterable order list (simple text input + scrollable list)
- Step 2: identical to the existing claim form in OrderDetail
- Mobile-friendly: `max-w-[calc(100vw-2rem)]` with scroll

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Claims.tsx` | Add "+ New Claim" button + two-step dialog (~120 lines of new JSX/logic) |

**1 file modified. No new files. No database changes. No new dependencies.**

