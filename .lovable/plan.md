## Backend & logic robustness pass

Extending the "noisy diagnostic toast" fix into a wider hygiene sweep across the DB, error handling, and Supabase function surface. Grouped from highest impact → lowest.

---

### 1. Database linter findings (security — 20 warnings)

Ran `supabase--linter`. All are SECURITY DEFINER / search_path issues. Three categories:

**a) Trigger-only functions accidentally exposed via PostgREST** (5 functions)
These should never be called over the API — they only fire from triggers — but PostgREST currently lets `anon` / `authenticated` call them. Revoke EXECUTE.

- `update_updated_at()`
- `set_delivered_at_on_status()`
- `refresh_entity_aggregates()`
- `restore_stock_on_deduction_delete()`
- `on_auth_user_created()`

**b) Admin / cron functions exposed to clients** (2 functions)
Cron + admin only — should be `service_role` only.

- `check_aging_transitions()` — called by `aging-check` edge function
- `aging_bucket_rank(text)` — helper, only used internally; also missing `SET search_path` → fix both at once

**c) RLS helper functions exposed to anon** (2 functions)
Needed by `authenticated` (RLS predicates), but `anon` has no reason to call them.

- `get_company_id()` — revoke from `anon` and `public`
- `has_role(uuid, app_role)` — revoke from `anon` and `public`

**d) App-callable RPCs — keep as-is** (intentional, called by signed-in users):
`setup_new_company`, `get_next_order_number`, `get_next_invoice_number`, `insert_order_atomic`, `dispatch_order_atomic`, `reverse_dispatch_for_order`, `preview_dispatch_impact`. Linter still warns on these but the warning is informational — they need authenticated EXECUTE to work. We'll document this in the security memory so future scans don't re-flag them.

Single migration: `REVOKE EXECUTE ... FROM public, anon` (+ `authenticated` for trigger/admin functions) and `ALTER FUNCTION aging_bucket_rank SET search_path = public`.

---

### 2. Error-handling consistency

We have a clean `handleSupabaseError()` helper that maps Postgres codes (23505 dup, 23503 FK, 42501 RLS, etc.) → friendly toasts + logs. A few sites still surface raw `error.message`:

- `src/pages/Company.tsx:230` — `toast.error("Error saving", { description: error.message })`
- `src/pages/OrderDetail.tsx:277` — `toast.error("Could not load stock preview", { description: error.message })`
- `src/pages/ResetPassword.tsx:47`, `src/pages/Company.tsx:165`, `src/components/onboarding/NoCompanyGuard.tsx:46`, `src/context/domains/useBillingDomain.ts:140 + 213` — `if (error) throw error` with no friendly mapping.

Migrate each to `handleSupabaseError(...)` (or for Billing throws, catch in caller and call helper). `Login.tsx` keeps its special-case handling because auth errors have unique branches that need raw matching.

---

### 3. Toast-vs-log discipline (pattern from last fix)

Audit confirms only one offender remained — the `warnPaginationOnce` toast we just removed. `warnTruncationOnce` (real data-loss) correctly stays as a user toast. No other dev-diagnostic toasts found.

Add a one-line rule to the security/dev memory: **info-level pagination + perf diagnostics → `console.warn` + `logError`, never `toast`. Only data-loss / failed-mutation / actionable issues become toasts.**

---

### 4. `batchIn` / `fetchAllChunked` safety review

- `batchIn`: 200 pages × 1000 rows = 200k cap per id-chunk. For order_lines this is generous; one mega-order would have to exceed 200k lines to trip. Keep.
- `fetchAllChunked`: same 200 × 1000 cap per table. With current data shape (~thousands of orders, hundreds of dealers), fine. If a tenant grows past ~150k rows in any single table the truncation toast will fire — acceptable signal.
- No change needed; the patterns are correct. Just adding a code comment clarifying the cap rationale so a future contributor doesn't lower it.

---

### 5. Files & migrations

**Migration (one):**
- `REVOKE EXECUTE` on 7 functions from `public` / `anon` / `authenticated` as appropriate
- `ALTER FUNCTION public.aging_bucket_rank(text) SET search_path = public`

**Code edits (frontend only):**
- `src/pages/Company.tsx` — replace raw `error.message` with `handleSupabaseError`
- `src/pages/OrderDetail.tsx` — same
- `src/pages/ResetPassword.tsx` — same
- `src/components/onboarding/NoCompanyGuard.tsx` — same
- `src/context/domains/useBillingDomain.ts` — same for the 2 throw sites

**Memory:**
- `mem://safety/backend-hygiene` — short rule: toast = user-actionable only; raw `error.message` is banned in UI; all mutations go through `handleSupabaseError`.
- `security--update_memory` — note the 7 intentionally-public RPCs so future scans skip them.

---

### Out of scope (call out, don't touch)

- Edge-function logic (aging-check, dashboard-digest, etc.) — already isolated, working.
- RLS policies — audited, all tables are `company_id = get_company_id()` scoped correctly.
- Adding a foreign-key constraint between e.g. `order_lines.order_id → orders.id`. None of the tables have FKs declared (intentional choice based on the schema). Worth a separate PR if you want it — happy to plan one.
