

## E2E verification plan

I'll verify the CTO batch changes end-to-end without modifying code. This is read-only QA — I'll report findings, you decide what (if anything) to fix before publishing.

### What I'll verify

**1. Browser smoke test on preview** (`/dashboard`)
- Dashboard loads, no console errors.
- Sidebar navigation: click into Orders, Stock, Billing, Activity Log → confirm lazy-loaded routes show skeletons then render.
- Open Activity History sheet → verify entries load + "Load more" button appears/works if >50 rows.
- Check console for any realtime/auth errors.

**2. Code-level audit** (read-only)
- Re-read `src/lib/preview-env.ts` — confirm tightened host check.
- Re-read `src/App.tsx` — confirm all heavy routes are `React.lazy()` with Suspense fallbacks.
- Re-read `src/context/data-utils.ts` `fetchAllChunked` — confirm loop terminates correctly, handles empty results, propagates errors.
- Re-read `src/context/domains/useOrdersDomain.ts` + `useBillingDomain.ts` — confirm chunked fetch is wired in.
- Re-read `src/components/layout/ActivityLog.tsx` — confirm cursor uses `created_at` not offset, dedup safe.
- Re-read `src/hooks/use-unsaved-changes-guard.ts` + `Company.tsx` + `NewOrder.tsx` — confirm no dangling references.
- Re-read `supabase/functions/seed-test-accounts/index.ts` — confirm `Deno.env.get("TEST_ACCOUNT_PASSWORD")` + fail-fast.

**3. Database/policy audit** (via supabase read-only tools)
- Query `pg_policies` for `companies`, `error_log`, `storage.objects` — confirm new policies are live, old broad policies dropped.
- Query `storage.buckets` — confirm `company-logos` is private.
- Run `supabase--linter` — catch any new warnings introduced by the migrations.

**4. Build sanity**
- `tail` dev-server log for any compile errors / HMR warnings since the last edits.

### Deliverable

A short report with:
- ✅ what passed
- ⚠️ any warnings (non-blocking)
- ❌ any blockers (must fix before publish)

If everything is green, you publish. If I find a blocker, I'll flag it and you decide whether to fix-then-publish or publish-then-patch.

### Out of scope
- No code changes during verification (read-only).
- No auth/signup flow test (would require creating a throwaway account in the live preview — ask if you want this).
- No load test on pagination with >1000 rows (would need seed data — ask if you want this).

