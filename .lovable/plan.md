# Pre-Handover Hardening Audit

A full sweep across the backend, business logic, and runtime to make sure nothing embarrassing ships with the handover ZIP. Read-only investigation — no code changes in this pass. Output is a single prioritised report (`/mnt/documents/ledge-hardening-audit.md`) with severity, file:line, and recommended fix for every finding. After you read it, we decide what to actually fix.

## Scope — 8 audit tracks

### 1. Security (highest priority)
- Run the Supabase security scanner + linter.
- Manually review every RLS policy on all 28 tables — confirm tenant isolation (`company_id = get_company_id()`) is enforced for SELECT/INSERT/UPDATE/DELETE.
- Check every `SECURITY DEFINER` function for: search_path set, caller authorization checks, no SQL injection surface.
- Audit edge functions: JWT validation, CORS, input validation (Zod), secrets usage, no service-role leakage to clients.
- Confirm no anon-key writes possible to sensitive tables (orders, invoices, profiles, user_roles).
- Storage: `company-logos` bucket policies — only own-company write, public read OK.

### 2. Money math (zero tolerance for bugs)
- `src/lib/order-pricing.ts` — re-verify scheme calculations, GST splits, rounding (paise drift), free-goods stock impact.
- `dispatch_order_atomic` RPC — re-confirm idempotency, reversal correctness, negative-stock handling.
- `refresh_entity_aggregates` trigger — verify totals match raw sums under concurrent writes.
- Aging buckets (`computeDealerAging`) — boundary checks (exactly 30/60/90 days).
- Revenue scope (delivered vs booked) — confirm UI labels match what's actually computed.
- Run `bunx vitest run` and audit any failing or skipped pricing/aging tests.

### 3. Data integrity
- Check for orphaned rows (order_lines without orders, invoices without orders, stock_deductions without orders) via read-only SQL.
- Foreign-key cascade behavior — confirm deleting a dealer/product doesn't silently nuke history.
- Unique constraints on critical fields (order_number, invoice_number, email per company).
- Trial-period + multi-tenant boundary: no cross-company leakage in any RPC.

### 4. Auth & RBAC
- Confirm `has_capability` and `has_role` actually block at DB level, not just UI.
- Verify capability-gated UI (`<Can>`, `<RequireCapability>`) wraps every dangerous action.
- Invite flow: token expiry, email match, no role escalation.
- Google OAuth callback hardening.

### 5. Edge functions
- `aging-check`, `dashboard-digest`, `explain-metric`, `seed-demo-account`, `seed-test-accounts` — review each for: auth, input validation, rate-limit risk, log/PII leakage, secret handling.
- Tail recent edge-function logs for unhandled errors.

### 6. Error handling & observability
- Confirm every Supabase mutation routes through `handleSupabaseError`.
- Audit `errorLog` table — recent errors, patterns, unhandled categories.
- Check `ErrorBoundary` coverage on every route.
- Toast hygiene — no dev diagnostics leaking to users.

### 7. Performance & runtime
- DataContext: confirm two-phase fetch, debounced realtime, no O(N×M) recomputes per memory note.
- Bundle size + vendor chunks.
- Largest tables (orders, order_lines, stock_deductions) — confirm appropriate indexes exist.
- DB health snapshot (connections, WAL, deadlocks).

### 8. Handover-package sanity
- Verify exported migrations in `/tmp/handoff/migrations/` actually replay cleanly on a blank schema (dry-run validation, not execution).
- Confirm `_db_functions.csv` includes every function currently live.
- README restore steps are accurate.

## Deliverable

`/mnt/documents/ledge-hardening-audit.md` with:

- **Executive summary** — counts by severity (Critical / High / Medium / Low / Info)
- **Per-finding entry** — title, severity, track, file:line or table/function, what's wrong, why it matters, recommended fix, effort estimate
- **Quick-win list** — anything fixable in <15 min
- **Must-fix-before-handover list** — anything that would embarrass us in a code review
- **Accepted-risk list** — known limitations the recipient should be told about (e.g. offline mode paused, dark mode archived)

Plus a one-pager `/mnt/documents/ledge-hardening-summary.md` you can paste to anyone in 30 seconds.

## What I will NOT do in this pass

- No code edits — purely diagnostic. After you read the report we pick what to fix.
- No load-testing or pen-testing (out of scope for a static audit).
- No re-litigation of product decisions already locked (V2 brand, paused offline, etc.).

## Estimated runtime

~10–15 minutes of tool calls (security scan + linter + read_queries + file reads across ~40 files + edge-function log tails). Single report at the end.
