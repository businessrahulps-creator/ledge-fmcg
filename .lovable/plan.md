# Platform tightening — findings & plan

Audited against Lovable + Supabase SaaS best practices. Most of the basics are already in place (RLS everywhere, roles in `user_roles`, `handleSupabaseError`, error_log rate limit, atomic RPCs with `company_id` guards). Below are the real gaps, ranked by impact.

## Findings

### 🔴 High — Edge function surface is wide open
All 5 edge functions ship with no JWT verification and wildcard CORS:
- `aging-check` — uses `SERVICE_ROLE_KEY` and calls `check_aging_transitions()`. **Anyone on the internet** can trigger it right now. Should be cron + service-role only.
- `dashboard-digest`, `explain-metric` — call Lovable AI Gateway with our `LOVABLE_API_KEY`. **Anyone can spam them and burn our AI budget.** No auth check, no per-user rate limit.
- `seed-demo-account`, `seed-test-accounts` — already gated by a password env var, but also publicly callable.
- All five return raw `e.message` to the client — leaks internal errors.

### 🟠 Medium — Auth hardening missing
- **Leaked password protection (HIBP)** not enabled — users can sign up with `password123`.
- **No CAPTCHA / signup rate limiting** — bot signup risk on the public `/signup`.
- **No MFA** option for super_admins (acceptable for V1, worth noting).

### 🟠 Medium — Database
- Linter "Extension in Public" warning still open (likely `pg_trgm` or similar) — move to `extensions` schema or accept and document.
- 9 remaining "SECURITY DEFINER callable by authenticated" warnings are **intentional** (our app RPCs) and already documented in `@security-memory` — confirmed each RPC does a `company_id = get_company_id()` guard. No action; just re-verifying.
- No size/type validation on `company-logos` storage uploads — a user could upload 100MB files.

### 🟡 Low — Observability & resilience
- `error_log` has no retention policy — will grow unbounded. Add a 90-day prune (pg_cron).
- No structured request/error metrics from edge functions (only `console.error`).
- No automated tests on RLS policies — easy to regress when adding tables.

### ✅ Already solid (no change needed)
- RLS on every table, scoped by `get_company_id()`.
- Roles split into `user_roles` + `has_role()` security definer.
- Atomic order/dispatch RPCs with retry on unique_violation.
- Client-side `handleSupabaseError` + `errorLog` rate-limited at 30s.
- `batchIn` / `fetchAllChunked` with sane 200×1000 caps.
- Profiles table prevents users from changing their own `company_id`.

## Proposed tightening plan

### PR 1 — Edge function lockdown (highest impact)

**`aging-check`** (cron-only):
- Add `[functions.aging-check] verify_jwt = false` (already default) **+** require header `x-cron-secret` matching a new `CRON_SECRET` env var. Reject otherwise.
- Sanitize error response: return `{ error: "Internal error", code }` not raw message.

**`dashboard-digest` + `explain-metric`** (authenticated users only):
- Add `[functions.X] verify_jwt = true` in `config.toml` so Supabase rejects un-authed calls.
- Inside the function, create a request-scoped supabase client with the user's JWT, call `auth.getUser()`, and gate on a valid user.
- Add per-user in-memory token-bucket rate limit (e.g. 20 calls / 5 min) to cap AI spend.
- Sanitize error responses.

**`seed-demo-account` / `seed-test-accounts`**:
- Keep public but require `Authorization: Bearer <secret>` header check before any work; return 401 fast.
- Tighten CORS to our two production origins (`getledge.in`, `*.lovable.app`) instead of `*`.

### PR 2 — Auth hardening
- Enable **leaked password protection** (HIBP) via `configure_auth`.
- Set min password length to 8.
- Document in `@security-memory` that CAPTCHA is deferred (Lovable Cloud doesn't expose Turnstile config natively yet).

### PR 3 — Storage & retention
- Migration: add `pg_cron` job that deletes `error_log` rows older than 90 days.
- Frontend: enforce 2MB / image-only on logo upload before calling storage (UI already does, just verify and add a fallback storage policy size check via a trigger).
- Move any `public`-schema extensions to `extensions` schema (one migration).

### PR 4 — RLS regression safety
- Add a one-file vitest that hits Supabase as `anon` and asserts every business table returns 0 rows / 401 — a smoke test against future "forgot RLS" mistakes.
- Add a short `docs/SECURITY.md` capturing the rules (company_id scope, role checks, edge function auth model) so future contributors don't drift.

### Out of scope (call out, don't do now)
- MFA for super_admins.
- FK constraints on `*_lines.parent_id` (intentional — performance vs. integrity tradeoff already accepted).
- Per-tenant rate limits on RPCs (would need pg-side counter table; revisit if abuse seen).

## Technical notes
- `verify_jwt = true` in `supabase/config.toml` is the cleanest way to gate AI endpoints — Supabase rejects the request before our code runs, saving cold-start cost.
- The cron-secret pattern for `aging-check` is needed even with service-role because the function URL is public; service-role is what the function uses internally, not what gates the request.
- HIBP toggle is a single `configure_auth` call, no schema change.
- `error_log` prune via `pg_cron` keeps the table fast and avoids paying for cold storage of stale debug rows.

Approve and I'll ship PR 1 first (biggest risk reduction), then 2 → 3 → 4 in separate turns.
