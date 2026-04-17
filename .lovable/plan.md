

## Full CTO fix batch — everything except HIBP

### Scope (9 items)

**P0 — Security**
1. **Preview detector overreach** — `src/lib/preview-env.ts`: tighten `isPreviewHost` to only match `id-preview--` hostnames. Stops disabling PWA on published `ledge-fmcg.lovable.app`.
2. **Lock down `companies` INSERT** — migration: drop the `auth.uid() IS NOT NULL` INSERT policy. Force all company creation through `setup_new_company()` SECURITY DEFINER (already used by onboarding).
3. **Tighten `error_log` INSERT** — migration: replace policy with `user_id = auth.uid() OR user_id IS NULL`. Prevents spoofing other users' error attribution. `errorLog.ts` already sets the correct user_id.
4. **Realtime channel safety** — audit all `.channel(...)` + `postgres_changes` subscriptions; add `filter: company_id=eq.<currentCompanyId>` to every tenant-table subscription. If any table is in `supabase_realtime` publication unnecessarily, remove via migration.

**P1 — Hardening & scale**
5. **Remove hardcoded test credentials** — `supabase/functions/seed-test-accounts/index.ts`: read password from `Deno.env.get("TEST_ACCOUNT_PASSWORD")`; fail clearly if unset. Use `add_secret` to prompt for the value.
6. **Disable LIST on `company-logos` bucket** — migration: storage policy that blocks bucket enumeration but keeps public object reads. Preserves PDF/render perf, removes file-listing risk.
7. **Cursor pagination** — convert `.range(0, 9999)` bulk fetches to `useInfiniteQuery` with `.range(cursor, cursor+pageSize)` for: `orders`, `invoices`, `activity_log`. Lift the silent 1000-row Supabase cap that hits any active company.

**P2 — Polish**
8. **Lazy-load heavy routes** — `src/App.tsx`: convert eagerly-imported pages (Dashboard, Orders, NewOrder, OrderDetail, Distributors, DealerDetail, Salespersons, SalespersonDetail, Stock, Schemes, Targets) to `React.lazy()` + existing skeletons. Keep entry routes (Index, Login, Signup, ResetPassword) eager.
9. **Clean `useUnsavedChangesGuard` dead code** — remove unused `confirmOpen`/`confirmLeave`/`cancelLeave` and any leftover router-data API stubs. Keep only the `beforeunload` path.

### Skipped (per earlier instruction)
- HIBP leaked-password protection.

### Implementation order
1. Preview detector (immediate user-visible fix).
2. Migrations bundle: `companies` INSERT, `error_log` INSERT, `company-logos` LIST policy.
3. Realtime audit + channel filters.
4. Pagination refactor (largest blast radius — orders → invoices → activity_log).
5. `seed-test-accounts` secret swap (`add_secret` first, wait for value, then edit).
6. Lazy routes + dead-code cleanup.

### Files touched
- `src/lib/preview-env.ts`
- `src/App.tsx`
- `src/hooks/use-unsaved-changes-guard.ts`
- `supabase/functions/seed-test-accounts/index.ts`
- New migration(s) for: drop companies INSERT policy, replace error_log INSERT policy, storage LIST policy, optional realtime publication trim.
- Pagination touches in: `src/context/domains/useOrdersDomain.ts`, `useBillingDomain.ts`, `src/components/layout/ActivityLog.tsx` (and any component consuming the full list), plus the relevant pages where "Load more" UI is wired.
- Realtime touches: any `supabase.channel(...)` callsite (will be located during audit).

### Verification after build
- Published `ledge-fmcg.lovable.app`: PWA install + update banner work; preview stays clean.
- Direct INSERT on `companies` via SQL editor → denied; signup/onboarding still works.
- Insert `error_log` with foreign `user_id` via SQL → denied; app error logging still works.
- Subscribe to a tenant channel as user A → no events from company B's writes.
- Logo URLs in invoices/PDFs still render; `LIST` on bucket → denied.
- Pagination: lists with >1000 rows now load incrementally; "Load more" works on Orders/Invoices/Activity.
- `seed-test-accounts` requires the secret; rejects calls if unset.
- Initial JS bundle smaller; route transitions show skeletons.
- `useUnsavedChangesGuard` callers compile and still warn on tab close.

### Out of scope
- HIBP.
- UI/visual changes.
- Business-logic changes.
- Auth flow changes beyond the policy tightening above.

