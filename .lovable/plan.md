
# Final Site-Wide QA, CTO Review & Adversarial Stress Test

## Fresh Audit Results

After a complete codebase review of all pages, layouts, contexts, and data flows, here are the issues found:

### CRITICAL — None found

Previous critical issues (nested Label, dark mode leak) were correctly fixed in the last pass. The Billing.tsx label on line 715 is now a single `<Label>`. The Index.tsx has `style={{ colorScheme: "light" }}`. The credit guard correctly uses `netOrderTotal` after scheme savings.

### HIGH

**H1. Realtime subscriptions for claims/invoices/targets/secondary_sales call `fetchAll` — too heavy**
Lines 313-316 of DataContext.tsx: A single change to any claim, invoice, target, or secondary sale triggers a full `fetchAll` (all 10+ tables). This causes unnecessary network load and UI flicker. These should use targeted refetch functions like the other domains do (e.g., `orders.safeRefetch()`).

**H2. Signup calls `setup_new_company` immediately — race with email confirmation**
`Signup.tsx` line 46: After `signUp()`, it immediately calls `setup_new_company` RPC and navigates to `/dashboard`. If email confirmation is enabled (which it should be for production), the user gets a company created but the session may not persist. The signup flow should check `authData.session` — if null (email confirmation required), show a "check your email" message instead of calling the RPC.

**H3. Save button on NewOrder is `bottom-28` which may overlap bottom nav**
Line 672: `sticky bottom-28` positions the save button 112px from the bottom. The bottom nav is `bottom-3` with padding. On smaller phones (iPhone SE, 320px width), the save button and bottom nav may visually collide when scrolled to bottom of a long order form.

### MEDIUM

**M1. NewOrder: duplicate product selection not prevented**
Users can select the same product on multiple lines. This creates confusing data — quantities should be merged or a warning shown. The `products.map()` in the SelectContent on line 452 does not filter out already-selected products.

**M2. Order lines allow zero unit price**
NewOrder line 475: The price input accepts 0 without warning. A user could submit an order with ₹0 unit prices, creating a ₹0 total order.

**M3. Distributor delete does not check for existing orders**
`Distributors.tsx` line 98: `deleteDistributor` is called without checking if the dealer has orders. Deleting a dealer with orders would leave orphaned `distributor_id` references on those orders.

**M4. Realtime channel has no debounce**
DataContext.tsx lines 306-316: Each postgres_changes event fires a refetch immediately. Bulk operations (e.g., importing 10 orders) will trigger 10 rapid refetches. Should debounce by 500ms.

**M5. `companyInfo.invoicePrefix` not exposed through `useApi()`**
The `api` object doesn't expose `invoicePrefix` or `setInvoicePrefix`, forcing Billing.tsx to use it through the data context directly or via `companyInfo`.

**M6. DealerDetail/SalespersonDetail: no 404 handling for invalid IDs**
`DealerDetail.tsx` line 50: If `dealer` is undefined (invalid ID in URL), the page should show a "not found" state. Currently it would crash on accessing properties of undefined.

**M7. Order total in Summary card shows gross total, not net**
NewOrder line 626: The "Order Total" in the summary card shows `orderTotal` (gross). Below it, the schemes section shows "Effective Total". The summary card should show the net total or at least label it as "Gross Total" to avoid confusion.

### LOW / POLISH

**L1. Dashboard: `maxDistVal` and `maxProdVal` could be 0 if data exists but all values are 0**
Lines 145/148: `topDistributors[0]?.totalValue || 1` — if the first dealer has totalValue of 0, this correctly falls back to 1. But if all dealers have 0 value, the progress bars show 0% which is correct. No issue.

**L2. AppLayout: duplicate Lucide icon imports**
Line 5 and 13 both import from "lucide-react" separately. Minor, no functional impact.

---

## Implementation Plan

### Pass 1: Fix signup email confirmation handling
| File | Fix |
|------|-----|
| `src/pages/Signup.tsx` | Check if `authData.session` is null after signup; if so, show "verify your email" message instead of calling RPC and navigating |

### Pass 2: Fix DealerDetail/SalespersonDetail 404 handling
| File | Fix |
|------|-----|
| `src/pages/DealerDetail.tsx` | Add early return with "not found" UI if `dealer` is undefined |
| `src/pages/SalespersonDetail.tsx` | Same treatment |

### Pass 3: Fix NewOrder summary label clarity
| File | Fix |
|------|-----|
| `src/pages/NewOrder.tsx:625` | Change "Order Total" label to "Gross Total" when schemes are applied |

### Pass 4: Fix heavy fetchAll on realtime for claims/invoices/targets
| File | Fix |
|------|-----|
| `src/context/domains/useBillingDomain.ts` | Add `safeRefetch` method |
| `src/context/domains/useTargetsDomain.ts` | Add `safeRefetch` method |
| `src/context/DataContext.tsx:313-316` | Use targeted safeRefetch instead of fetchAll |

Total: 6 files, ~60 lines of surgical changes. Zero new features. All existing behavior preserved.
