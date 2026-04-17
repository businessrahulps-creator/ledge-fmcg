

## QA + CTO check — scope & approach

I'll do a focused review across three lenses: **Correctness**, **Security**, **Architecture/scale**. Read-only — produces a written report, no code changes.

### What I'll inspect

**1. Correctness & recent regressions**
- Verify the preview-env fix actually disables PWA across all entry points (re-read `main.tsx`, `UpdatePrompt`, `App.tsx`, `use-install-prompt`, `vite.config.ts` PWA plugin config).
- Verify `useUnsavedChangesGuard` no longer crashes and check all callers still work.
- Spot-check `Billing.tsx` badge fix.
- Look for other usages of `useBlocker`, `data router` APIs, or other react-router v6 data-mode hooks that could crash similarly.

**2. Security (CTO lens)**
- Run `security--run_security_scan` for current Supabase findings.
- Audit RLS coverage on all tables (`security--get_table_schema`).
- Confirm `user_roles` separation pattern is followed (no roles on profiles table).
- Check edge functions (`seed-demo-account`, `seed-test-accounts`) for auth gating and secret usage.
- Confirm no secrets/keys leaked in client code; confirm anon key only is used on client.
- Check auth flows: signup/login/reset password — email verification on, no anonymous sign-ins, password validation.

**3. Architecture & scale**
- DataContext: confirm domain split, look for N+1 patterns, large in-memory caches, missing pagination.
- Query limits: scan for Supabase queries missing `.range()`/`.limit()` (1000-row default risk).
- Error handling: confirm `ErrorBoundary` + `PageErrorBoundary` cover all routes; check `errorLog` usage.
- Bundle health: check `vite.config.ts` for code-splitting, lazy routes in `App.tsx`.
- Test coverage: list existing vitest + playwright suites, flag critical paths missing tests (auth, order pricing, billing).

**4. Data integrity**
- Look for migrations using CHECK constraints with `now()` (forbidden — must be triggers).
- Confirm no triggers attached to reserved schemas.
- Confirm activity_log append-only pattern is enforced via RLS.

### Deliverable
A single structured report grouped by severity:
- **P0 / blockers** — crashes, security holes, data loss risk
- **P1 / important** — scale risks, missing tests on critical paths, UX regressions
- **P2 / polish** — cleanup, consistency, nice-to-haves

Each finding includes: file/location, what's wrong, recommended fix, effort estimate.

### Out of scope
- No code changes (read-only QA pass).
- No design/visual review (separate concern).
- No performance profiling in browser (would need explicit ask).

### After the report
You pick which findings to fix and I'll implement them in priority order.

