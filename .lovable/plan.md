## Goal
Tighten New Order validation so no order can be saved without a warehouse, give clear inline feedback for every required field, and surface stock-availability info — without breaking realistic FMCG workflows (advance orders, in-transit stock).

## File to change
- `src/pages/NewOrder.tsx` (single file, no schema changes)

## Changes

### 1. Warehouse — always required
- Remove the conditional in label (line 459): show `Source Warehouse *` unconditionally.
- In `executeSave` (line 216-219): drop the `deliveryStatus` condition — always block save if `!selectedGodown`.
- Add inline red error text under the warehouse Select when user has attempted save and field is empty.

### 2. Dispatch date — conditionally required (UX-aware)
- Required only when `deliveryStatus === "dispatched"` or `"delivered"`. For "Pending", remains optional (matches Indian FMCG advance-order workflow).
- Label shows `*` only when conditionally required (mirrors current warehouse pattern but inverted: now it's the *date* that's conditional, warehouse is unconditional).
- Inline error if missing in those states.

### 3. Stock availability — warning, not block
- For each line, look up `api.stock.items.list()` filtered by `selectedGodown` + `productId`.
- If selected qty > available qty, show inline **amber warning** under the line: `Only X units available at <warehouse name>`.
- Does NOT block save — distributors often take orders against incoming stock. Logged as a soft warning only.
- If `selectedGodown` is empty, suppress the warning (nothing to compare against yet).

### 4. Inline error pattern (replaces toast-only validation)
- Add `attemptedSave` state — set to `true` on first save click.
- Each required field renders inline red text below it when `attemptedSave && <invalid>`.
- Keep existing toasts as a secondary signal.
- Auto-scroll to first invalid field on save click using `scrollIntoView({ behavior: "smooth", block: "center" })`.

### 5. Save button stays enabled (UX)
- Do NOT disable the Save button based on validation — known anti-pattern (silent failure on click).
- Keep `disabled={isSaving}` only.
- Validation runs on click; inline errors + scroll-to-first-error provide clear feedback.

## Out of scope
- No DB schema changes, no migration.
- No changes to credit-limit override flow, scheme engine, payment fields, or order creation API.
- No changes to other forms (Edit Order, etc.) — only the New Order page.
- Stock availability remains a warning; if user later wants to *block* under-stock orders, that's a follow-up toggle in Settings.

## Risk
Low. Single-file change, additive validation logic, no API contract changes. Existing tests in `src/lib/__tests__/order-pricing.test.ts` are unaffected (pricing engine untouched).
