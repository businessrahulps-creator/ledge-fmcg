

# Add Automated Testing for Core Flows

## Problem
Only 7 utility test files exist (formatting, sanitization, scorecards). Zero integration tests for the domain hooks that drive all business logic, and zero E2E tests for critical user journeys.

## Strategy

Two layers of testing, prioritized by impact:

### Layer 1: Domain Hook Unit Tests (Vitest)
Test each domain hook in isolation by mocking `supabase` and verifying state transitions. These are fast, deterministic, and cover the core business logic without needing a running backend.

### Layer 2: E2E Tests (Playwright)
Test critical user journeys through the real UI against the live preview. These validate the full stack — auth, database, UI interactions.

---

## Layer 1: Domain Hook Unit Tests

Each test file creates a test harness using `renderHook` with mocked Supabase client. We mock `supabase.from()`, `supabase.rpc()`, and `navigator.onLine`.

### Files to create:

| File | What it tests |
|------|---------------|
| `src/context/domains/__tests__/useOrdersDomain.test.ts` | `addOrder` (online + offline), `updateOrder` (status transitions, stock deduction trigger), `deleteOrder`, `previewOrderNumber` |
| `src/context/domains/__tests__/useDealersDomain.test.ts` | CRUD operations, offline queue enqueue |
| `src/context/domains/__tests__/useCatalogDomain.test.ts` | Product + scheme CRUD |
| `src/context/domains/__tests__/useStockDomain.test.ts` | Stock item CRUD, `deductStockForOrder` logic, godown management |
| `src/context/domains/__tests__/useBillingDomain.test.ts` | Invoice creation (sequence number), claim creation (stock restore), status updates |
| `src/context/domains/__tests__/useTargetsDomain.test.ts` | Target + secondary sale CRUD |
| `src/utils/activityLog.test.ts` | `logActivity`, `fmtAmount` |
| `src/context/__tests__/data-utils.test.ts` | `mapOrders`, `mapDistributor`, `batchIn`, `persistAllToCache` |

### Key test scenarios for Orders (highest priority):

1. **addOrder online** — mocks `supabase.rpc("insert_order_atomic")` returning `{id, order_number, seq}`, verifies order is added to state with correct number
2. **addOrder offline** — sets `navigator.onLine = false`, verifies mutation is enqueued via `enqueueMutation`, temp ID assigned, sequence incremented locally
3. **updateOrder with stock deduction** — transition from `pending` → `dispatched` with a godownId triggers `deductStockForOrder`
4. **updateOrder without stock deduction** — transition from `dispatched` → `delivered` does NOT re-deduct
5. **deleteOrder** — cascading delete of stock_deductions, order_schemes, order_lines, then order
6. **deleteOrder offline** — returns false with error toast

### Key test scenarios for Billing:

1. **addInvoice** — mocks `get_next_invoice_number` RPC, verifies invoice number format, lines inserted
2. **deleteInvoice** — final status blocks deletion
3. **addClaim with stock restore** — verifies stock quantity incremented

### Test harness pattern:

```typescript
// Shared mock factory
function createMockSupabase() {
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    // chain terminators
  });
  return { from: mockFrom, rpc: vi.fn() };
}
```

Each domain hook is a plain function returning state + callbacks — we call it inside `renderHook` with mock deps.

---

## Layer 2: E2E Tests (Playwright)

### Files to create:

| File | Journey |
|------|---------|
| `e2e/auth.spec.ts` | Signup → dashboard redirect, Login → dashboard, Login with wrong credentials → error toast, Logout → redirect to login |
| `e2e/order-lifecycle.spec.ts` | Create order → verify in list → update payment status → update delivery status → verify stock deduction → delete order |
| `e2e/billing.spec.ts` | Create GST invoice from order → verify in list → finalize → verify cannot delete |

### Auth test approach:
- Use a dedicated test account (create via signup flow in test setup)
- Store session for reuse across order/billing tests

### E2E test pattern:
```typescript
import { test, expect } from "../playwright-fixture";

test("create order and verify in list", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[id="email"]', testEmail);
  await page.fill('[id="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
  
  await page.goto("/orders/new");
  // Fill form fields, submit, verify redirect + toast
});
```

---

## Execution Order

1. Create shared test utilities (`src/test/mock-supabase.ts`)
2. `data-utils.test.ts` — pure functions, no mocking needed for mappers
3. `useOrdersDomain.test.ts` — highest business value
4. `useBillingDomain.test.ts` — second highest
5. Remaining domain hooks
6. E2E auth test
7. E2E order lifecycle test
8. E2E billing test

## Files Created

| File | Lines |
|------|-------|
| `src/test/mock-supabase.ts` | ~60 |
| `src/context/__tests__/data-utils.test.ts` | ~120 |
| `src/context/domains/__tests__/useOrdersDomain.test.ts` | ~200 |
| `src/context/domains/__tests__/useBillingDomain.test.ts` | ~150 |
| `src/context/domains/__tests__/useDealersDomain.test.ts` | ~80 |
| `src/context/domains/__tests__/useCatalogDomain.test.ts` | ~80 |
| `src/context/domains/__tests__/useStockDomain.test.ts` | ~120 |
| `src/context/domains/__tests__/useTargetsDomain.test.ts` | ~60 |
| `src/utils/activityLog.test.ts` | ~40 |
| `e2e/auth.spec.ts` | ~80 |
| `e2e/order-lifecycle.spec.ts` | ~120 |
| `e2e/billing.spec.ts` | ~80 |

Total: 12 new files, ~1,190 lines of test code. Zero changes to production code.

