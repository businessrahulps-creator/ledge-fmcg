

# Fix: Premature Success Toasts on Delete (FK Constraint Errors)

## Root Cause
The `makeOfflineCrud.remove()` function is async — it returns a Promise. But all 5 pages that call it do so **without `await`** and immediately show a success toast. When the DB rejects the delete (FK RESTRICT), the user sees both a success toast AND an error toast.

## Affected Pages
1. **Distributors.tsx** — `deleteDistributor(deleteId)` + instant success toast
2. **Salespersons.tsx** — `deleteSalesperson(deleteId)` + instant success toast
3. **Stock.tsx** — `deleteProductCtx(deleteProductId)` + instant success toast
4. **Stock.tsx** — `deleteLocation(deleteWarehouseLoc.id)` + instant success toast
5. **Schemes.tsx** — `api.schemes.remove(deleteId)` + instant success toast

## Fix Strategy

### Step 1: Make `makeOfflineCrud.remove()` return success/failure

Change `remove` in `src/context/data-utils.ts` to return `Promise<boolean>` — `true` if deleted, `false` if error. Move the success toast INTO the crud function (alongside the existing error toast), so callers don't need to manage toasts at all.

### Step 2: Update all 5 delete handlers

Make each `confirmDelete` function `async`, `await` the remove call, and remove the manual success toast (since it's now handled inside `remove`). Also improve the FK error message to be user-friendly (e.g., "Cannot delete — this dealer has existing orders").

### Step 3: Improve FK error messages

In `makeOfflineCrud.remove()`, detect the FK violation error string and replace the raw Postgres message with a human-readable one like "This dealer has orders linked to it. Remove those orders first."

### Files Changed
| File | Change |
|------|--------|
| `src/context/data-utils.ts` | `remove()` returns `boolean`, shows success toast internally, maps FK errors to friendly messages |
| `src/pages/Distributors.tsx` | `await` the delete, remove manual success toast |
| `src/pages/Salespersons.tsx` | Same pattern |
| `src/pages/Stock.tsx` | Same for product + warehouse delete |
| `src/pages/Schemes.tsx` | Same pattern |

