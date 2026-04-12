

# Full Site-Wide QA, CTO Review & Production Readiness Audit

## Audit Findings

### Critical (Must Fix Before Launch)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | **`claim_lines` fetched without company filter** — `supabase.from("claim_lines").select("*").range(0, 9999)` fetches ALL claim lines across all companies. Same for `invoice_lines`. Data leakage risk. | `DataContext.tsx:368-370` | Security: cross-tenant data leak |
| C2 | **No `order_schemes` delete on order delete** — `deleteOrder` deletes `stock_deductions` and `order_lines` but not `order_schemes`, leaving orphaned rows | `DataContext.tsx:1076-1092` | Data integrity |
| C3 | **Dashboard order cards not clickable** — mobile order cards on Dashboard don't navigate to order detail (missing `onClick`/`Link`), unlike the Orders page | `Dashboard.tsx:260-280` | UX: dead-end for users |
| C4 | **`useOnlineStatus` called in both `OnlineStatusWatcher` and `AppLayout`** — double toast firing on online/offline events | `App.tsx:47` + `AppLayout.tsx:41` | UX: duplicate toasts |
| C5 | **Missing DB triggers** — The `refresh_entity_aggregates` function exists but no triggers are attached (`db-triggers` section says "no triggers"). Distributor/salesperson/product aggregate columns won't auto-update. | DB config | Data integrity: stale aggregates |

### High Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| H1 | **Excessive `(d as any)` casts** throughout DataContext — typed DB schema exists but is bypassed, hiding type errors | `DataContext.tsx` throughout | Maintainability, potential runtime bugs |
| H2 | **Billing page mobile view missing** — Desktop table only (`hidden md:block`), no mobile card layout for invoices | `Billing.tsx:420+` | Mobile UX: blank page on mobile |
| H3 | **OrderDetail `useEffect` dep on `order?.id`** — if order data refreshes with same ID, edited state won't re-sync. Also creates new `crypto.randomUUID()` line IDs on every re-render trigger | `OrderDetail.tsx:125-145` | UX: potential state desync |
| H4 | **`--accent` CSS variable defined twice** in `:root` — first as `#4F46E5` (line 28-30), then as HSL `0 0% 96%` (line 51). The second overrides the first. | `index.css:28-51` | Visual: accent color inconsistency |
| H5 | **Claims page has no empty state** — if no claims exist, users see a blank area with just tabs | `Claims.tsx` | UX: confusing for new users |
| H6 | **Bottom nav "More" menu missing Billing, Claims, Targets, Schemes** — these pages are only accessible via desktop sidebar | `AppLayout.tsx:31-36` | Mobile: pages unreachable |
| H7 | **`invoice_lines` has no UPDATE RLS policy** — can't update invoice lines once created | DB RLS | Functional limitation |

### Medium Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| M1 | **Dashboard recent orders don't show salesperson** — mobile cards only show dealer, not who took the order | `Dashboard.tsx:258-280` | Minor info gap |
| M2 | **No loading state on Claims page resolve/reject** — `resolvingId` is set but the button doesn't show a spinner | `Claims.tsx:43-58` | UX polish |
| M3 | **Salespersons page missing PDF export** — only has CSV export, unlike Dealers which has both | `Salespersons.tsx` | Feature parity |
| M4 | **Order list pagination renders below empty state** — when no orders match filters, both the empty state and pagination show | `Orders.tsx:247-263` | Minor visual bug |
| M5 | **Stock page: no confirmation on bulk stock set** — `setStockItems` directly updates all stock without confirmation | `Stock.tsx` | Data safety |
| M6 | **Performance page: chart colors hardcoded** — don't respect theme tokens, may have poor contrast in dark mode | `Performance.tsx` | Accessibility |
| M7 | **Company page doesn't validate GSTIN format** — accepts any string, should validate 15-char alphanumeric pattern | `Company.tsx` | Data quality |

---

## Proposed Fix Plan (Implementation Order)

### Pass 1: Critical Security & Data Fixes
1. **C1**: Add `.eq("company_id", cId)` filter to `claim_lines` and `invoice_lines` queries in DataContext (requires joining through parent or filtering by claim/invoice IDs already fetched)
2. **C2**: Add `order_schemes` delete before `order_lines` delete in `deleteOrder`
3. **C4**: Remove `useOnlineStatus()` from `AppLayout.tsx` (keep only in `OnlineStatusWatcher`)
4. **C5**: Create DB migration to attach `refresh_entity_aggregates` triggers to `orders` and `order_lines` tables

### Pass 2: High Priority UX Fixes
5. **C3**: Wrap Dashboard mobile order cards with navigation to `/orders/{id}`
6. **H2**: Add mobile card layout for Billing page invoices
7. **H4**: Remove duplicate `--accent` CSS variable definition
8. **H5**: Add empty state to Claims page
9. **H6**: Add Billing, Claims, Targets, Schemes to mobile "More" menu

### Pass 3: Medium Priority Polish
10. **M2**: Add loading spinner to Claims resolve/reject buttons
11. **M4**: Move pagination inside the conditional that checks for results
12. **H3**: Fix OrderDetail useEffect to use `JSON.stringify(order?.lines)` or a proper deep comparison

### Deferred (non-blocking)
- H1 (type casts): Large refactor, defer to post-launch
- H7 (invoice_lines UPDATE RLS): Only needed if inline editing of invoice lines is added
- M3, M5, M6, M7: Polish items for next sprint

---

## Files to Edit

| File | Changes |
|------|---------|
| `src/context/DataContext.tsx` | C1 (filter claim/invoice lines), C2 (delete order_schemes on order delete) |
| `src/components/layout/AppLayout.tsx` | C4 (remove duplicate online status), H6 (add missing mobile nav items) |
| `src/pages/Dashboard.tsx` | C3 (clickable order cards) |
| `src/index.css` | H4 (remove duplicate accent var) |
| `src/pages/Billing.tsx` | H2 (mobile card layout) |
| `src/pages/Claims.tsx` | H5 (empty state), M2 (loading spinner) |
| `src/pages/Orders.tsx` | M4 (pagination placement) |
| `src/pages/OrderDetail.tsx` | H3 (useEffect fix) |
| DB migration | C5 (triggers for aggregates) |

Total: ~9 files, ~15 surgical changes. No new features, no new dependencies.

