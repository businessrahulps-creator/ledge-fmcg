
# Critical auth/session stability fix

## What I found in the current code
1. `src/pages/NewOrder.tsx`
   - `addOrder(order)` is called without `await`.
   - The page always runs `setTimeout(() => navigate("/orders"), 2500)`, which violates your “stay on same page” requirement.
   - `isSaving` drives both the pending state and the success overlay, so the page stays in a fake “saving” state until navigation happens.

2. `src/context/DataContext.tsx`
   - `addOrder` does multiple backend calls (`get_next_order_number` → `orders` insert → `order_lines` insert) without a single guarded flow.
   - Most CRUD methods do not consistently `try/catch`, return results, or prevent optimistic UI updates on failure.
   - Realtime subscriptions refetch blindly, have no subscribe-status/error handling, and do not listen to `order_lines`, which can create inconsistent order state right after first save.

3. `src/context/AuthContext.tsx`
   - `onAuthStateChange` is `async`, which is a known source of auth race conditions.
   - There is no proper “auth ready” gate before data fetching starts.
   - Profile fetch errors are ignored, which can leave session state looking like a logout.

4. `src/pages/Login.tsx`
   - Login is minimal and does not verify/restabilize session state after sign-in.
   - Errors are surfaced, but the flow is not hardened against stale local auth state or transient backend session issues.

## Implementation plan

### 1. Stabilize auth state first
Update `src/context/AuthContext.tsx` to:
- Remove `async` work from `onAuthStateChange`.
- Restore session with `getSession()` first, then fetch profile in a separate guarded effect.
- Add a true auth readiness gate so protected routes don’t redirect during session restoration.
- Wrap profile fetch, refresh, and sign-out in `try/catch`.
- Never clear `user/session` because of profile/data errors; only clear on explicit sign-out or auth loss.

### 2. Make order creation fully awaited and non-navigating
Update `src/pages/NewOrder.tsx` to:
- Make `handleSave` `async`.
- `await` the order creation call and only celebrate on actual success.
- Remove forced navigation to `/orders`.
- Split state into:
  - `isSaving` for request-in-flight
  - `showSuccess` for temporary confetti/success UI
- Keep the user on the same page after save, with toast/confetti intact.

### 3. Harden the order creation path in DataContext
Refactor `src/context/DataContext.tsx` so `addOrder`:
- Returns a `Promise<{ success: boolean; orderNumber?: string; error?: string }>` instead of fire-and-forget.
- Uses one guarded flow with `try/catch/finally`.
- Only updates local state after all required inserts succeed.
- Refetches authoritative order data after creation instead of relying on partial optimistic state.
- Handles backend/RPC errors with user-friendly toasts but never touches auth state.

### 4. Stabilize realtime subscriptions
Refactor the realtime effect in `src/context/DataContext.tsx` to:
- Subscribe only after auth is ready and `companyId` exists.
- Add subscription status handling (`SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`).
- Subscribe to `order_lines` as well as `orders`, `distributors`, `salespersons`, `products`, `godowns`, and `stock_items`.
- Route all realtime callbacks through safe refetch helpers with `try/catch`.
- Cleanly tear down and recreate channels when company/session changes.

### 5. Add safer data-loading behavior
Improve `src/context/DataContext.tsx` loading/fetch logic to:
- Clear stale company data when there is no active company/session.
- Guard against stale async responses with a mounted/request token pattern.
- Avoid setting “logged out” UI because of a failed table query.
- Keep `loading` tied to actual initial fetch completion, not partial state.

### 6. Make login resilient
Update `src/pages/Login.tsx` to:
- Wrap sign-in in `try/catch`.
- After successful sign-in, confirm session restoration before navigating.
- Show clearer messages for invalid credentials vs transient backend errors.
- Avoid false “Login failed” states caused by stale client session state.

### 7. Tighten the API surface
Update `src/services/api.ts` to:
- Reflect async return types for create/update operations that must be awaited.
- Keep the UI-facing API shape familiar, but make order creation explicitly promise-based.

## Recommended backend adjustment
I would also tighten the order-number/database side while fixing this:
- Keep `get_next_order_number` usable only for the signed-in user’s own company.
- Prefer a single backend function for “create order + lines + number generation” if the current multi-call flow still proves fragile after code hardening.

This is not just a security improvement; it also removes race conditions around first-order creation.

## Files to change
- `src/context/AuthContext.tsx`
- `src/context/DataContext.tsx`
- `src/services/api.ts`
- `src/pages/NewOrder.tsx`
- `src/pages/Login.tsx`
- `src/App.tsx` (only if ProtectedRoute needs the new auth-ready flag)
- Optional backend migration for safer order-creation RPC

## Verification I will run after implementation
1. Sign up with a fresh email.
2. Confirm workspace/profile/company load normally with seeded data.
3. Create the first order.
4. Confirm:
   - no forced navigation
   - no refresh
   - no logout
   - confetti/toast stay on the page
5. Refresh the app and confirm the order persists.
6. Sign out and sign back in with the same credentials.
7. Confirm login succeeds and all seeded + newly created data is still visible.
8. Confirm realtime still updates data without throwing session/auth issues.

## Expected outcome
After this fix:
- first order creation will no longer kick the user out
- the app will stay on the current page after save
- session persistence will survive RPC/data mutations
- login will remain valid after order creation and refresh
- realtime updates will no longer be able to destabilize auth state
