

## In-app error logging (Sentry-style, no external dep)

Use Lovable Cloud — same pattern as the existing `activity_log`. A new `error_log` table captures all silent backend failures, and a viewer in Settings lets the founder triage them.

### 1. New table: `error_log`
Migration creates:
- `id uuid pk`, `created_at timestamptz default now()`
- `company_id uuid` (nullable — pre-company errors still log), `user_id uuid` (nullable)
- `severity text` (`error` | `warning` | `info`)
- `source text` (e.g. `rpc:setup_new_company`, `crud:distributors.add`, `sync:replay`)
- `message text`, `stack text`
- `context jsonb` (route, payload sketch, attempt count, online state, user agent)
- `resolved boolean default false`

RLS: only `super_admin` of a company can `SELECT`; `INSERT` allowed for any authenticated user (so failures from broken-state users like the orphan case still land).

### 2. New util: `src/utils/errorLog.ts`
Single fire-and-forget function:
```ts
logError({ source, error, severity?, context? })
```
- Captures `message`, `stack`, current route, `navigator.onLine`, user agent.
- Best-effort insert into `error_log`; on failure, queues to IndexedDB `idb-keyval` under `errorlog:queue` and replays on next online tick.
- Also calls `console.error` so dev tools still show it.
- Rate-limits identical errors (same `source + message`) to once per 30s to avoid floods.

### 3. Wire it into the silent-failure spots
Add `logError(...)` calls in the catch blocks / error branches that currently just `console.error` or fail silently:
- **`src/context/AuthContext.tsx`** — auto-recovery `setup_new_company` failure.
- **`src/context/data-utils.ts`** — `makeOfflineCrud.add/update/remove` when `companyId` missing AND when Supabase returns an error.
- **`src/context/DataContext.tsx`** — data fetch errors (line 233), sync replay failures (line 286).
- **`src/lib/offline-store.ts`** — `replaySingleMutation` errors and stock-deduction partial failures.
- **`src/context/domains/useOrdersDomain.ts`** and other domain hooks — RPC error branches.
- **`src/pages/Signup.tsx`**, **`Company.tsx`** — RPC failures.
- **Global**: `window.addEventListener("unhandledrejection")` + `window.onerror` in `main.tsx` to catch anything unanticipated.

### 4. Viewer: `src/pages/Settings.tsx` → new "System Health" card (super-admin only)
- Lists last 50 errors grouped by `source`, with count, last-seen time, severity badge.
- Expand row → shows message, stack, context JSON.
- Actions: "Mark resolved", "Copy details" (for support).
- Empty state: "No errors logged. ✨"
- Hidden for non-super-admin roles (uses existing `userRole`).

### 5. Optional retention
Migration adds a comment recommending periodic cleanup (no cron — keep it simple). Viewer auto-limits to 500 most recent rows in the query.

## Files
1. **Migration** — create `error_log` table + RLS policies.
2. `src/utils/errorLog.ts` — new util with offline queue + rate limiting.
3. `src/main.tsx` — global handlers.
4. `src/context/AuthContext.tsx`, `src/context/data-utils.ts`, `src/context/DataContext.tsx`, `src/lib/offline-store.ts`, `src/context/domains/useOrdersDomain.ts`, `src/context/domains/useBillingDomain.ts`, `src/pages/Signup.tsx`, `src/pages/Company.tsx` — wire `logError` into existing catch blocks.
5. `src/pages/Settings.tsx` — new "System Health" section visible to super-admin only.

## Out of scope
- No external service (Sentry, LogRocket) — stays inside Lovable Cloud, no new keys.
- No PII scrubbing rules beyond not logging full payloads (we only log a small "context sketch").
- No alerting/email — viewer-only for v1.
- No changes to `activity_log` (different concern: user actions vs. system errors).

## Why this is right-sized
- Reuses the proven `activity_log` pattern (table + util + fire-and-forget).
- Captures exactly the kind of bug we just fixed: orphan-company silent CRUD no-ops would have lit up under `source=crud:*` with `message="Workspace not set up"` immediately.
- Zero perf cost on happy path, zero new dependencies, zero ops overhead.

