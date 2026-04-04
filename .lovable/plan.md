

# Fix Order Success UX + Remove Auto-Seeding from Signup

## Issue 1: Order Success Overlay → Toast + Auto-Redirect

**Current**: After order creation, a full-screen overlay appears with "Order Created! Tap anywhere to go to orders" (`showSuccess` state + `AnimatePresence` block at lines 492-520).

**Fix in `src/pages/NewOrder.tsx`**:
- Remove `showSuccess` state variable entirely
- Remove the entire `AnimatePresence` success overlay block (lines 492-520)
- Remove `showSuccess` references from the button disabled/label logic
- After `result.success`:
  - Fire confetti (already there)
  - Show toast: `toast.success(\`Order #${result.orderNumber} created successfully!\`)`
  - Auto-redirect: `setTimeout(() => navigate("/orders"), 2000)`
- Button just shows "Save Order" / "Saving..." (no "Order Saved!" state needed)

## Issue 2: Remove Auto-Seeding from Signup

**Current**: `setup_new_company` RPC calls `seed_company_data()` for every new signup.

**Fix via migration**: Replace `setup_new_company` function to remove the `PERFORM seed_company_data(v_company_id)` line. New companies start empty.

The existing test account's demo data is already in the database and won't be affected.

## Files to Change

| Action | File | What |
|--------|------|------|
| Edit | `src/pages/NewOrder.tsx` | Remove overlay, add 2s auto-redirect |
| Create | Migration SQL | Update `setup_new_company` to skip seeding |

