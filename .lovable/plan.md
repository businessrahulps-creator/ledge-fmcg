
# Release-Ready Polish Plan

Two RLS blockers (`order_lines` viewer guard, `team_invites` INSERT) and `extension_in_public` were already fixed in the previous migration round. This plan closes the remaining four nice-to-fix items so the build crosses 9/10 and is publish-ready.

## Scope

1. **Console hygiene** — route 20 stray `console.*` calls through `logError` / silence justified fallbacks.
2. **Type tightening** — surgical `any` removal in the high-risk surfaces only (domain hooks, mutation paths, AdminErrors), leaving leaf UI casts alone.
3. **Test coverage** — add Vitest specs for Stock, Targets, Schemes business logic.
4. **Verification pass** — re-run lint/tests, confirm no regressions.

Intentionally **out of scope**: rebuilding `useTargetsDomain` types, refactoring `DataContext`, or touching `src/integrations/supabase/types.ts` (auto-generated).

---

## 1. Console cleanup (20 sites → 0 stray)

Classify each call, then act:

**Convert to `logError` (user-impacting failures, currently invisible to ops):**
- `src/utils/shareWhatsApp.ts` × 2 — share fallback failures
- `src/utils/exportPdf.ts` × 1 — PDF export failure
- `src/utils/activityLog.ts` × 1 — audit log insert failure
- `src/context/DataContext.tsx` × 3 — data fetch error, sync attempt failures, realtime channel error
- `src/lib/offline-store.ts:282` — stock deduction replay failure (the only critical one in that file)
- `src/context/data-utils.ts` × 2 — pagination/truncation warnings (use logError severity=warning)

**Keep but justify with comment:**
- `src/components/ErrorBoundary.tsx`, `PageErrorBoundary.tsx` — React boundary lifecycle requires console for dev DX; add `// eslint-disable-next-line no-console -- boundary fallback`
- `src/lib/offline-store.ts` IDB cache writes/reads (5 calls) — silent IDB fallbacks are intentional; offline mode is paused (see memory), so wrap them in `if (import.meta.env.DEV)` so prod stays quiet
- `src/pages/NotFound.tsx` — 404 telemetry; switch to `logError` severity=info

Add an ESLint rule `no-console: ["warn", { allow: [] }]` scoped to `src/**` with an allowlist of `ErrorBoundary` files via overrides, so new stray calls fail review going forward.

## 2. Type tightening (`any` pass)

Real count is **175** (broader than the 64 you mentioned — includes `as any` casts). Don't chase all of them; target the three risk zones:

**Tier A — must fix (mutation/data paths):**
- `src/context/domains/useOrdersDomain.ts`, `useBillingDomain.ts`, `useTargetsDomain.ts` — replace `payload: any` with Database insert/update types from `@/integrations/supabase/types`.
- `src/utils/handleSupabaseError.ts` — already exported `unknown`; audit & remove internal `any`.
- `src/context/DataContext.tsx` — type the realtime payload and queue items.
- `src/pages/AdminErrors.tsx` — type the error_log row.
- `src/pages/Company.tsx` — remove the four `as any` casts on the companies select/update (we now have all those columns in types).

**Tier B — leave alone:**
- Test mocks (`src/test/mock-supabase.ts`), `data-utils` chunkers, leaf components casting to satisfy third-party libs. Document the policy in `mem://safety/backend-hygiene` so future passes don't churn here.

Goal: bring `any` count to **< 60**, with zero `any` in mutation/realtime paths.

## 3. Tests for Stock / Targets / Schemes

Domain hooks already have tests (`useStockDomain.test.ts`, `useTargetsDomain.test.ts`). The gap is **page-level business logic**:

- **`src/pages/Stock.test.tsx`** — render with mock DataContext, assert: low-stock filter, out-of-stock badge math, RBAC (accountant sees value only), bulk-edit modal validation.
- **`src/pages/Targets.test.tsx`** — period switch (monthly/quarterly), achievement % calc, revenue-vs-orders toggle, empty state.
- **`src/pages/Schemes.test.tsx`** — scheme-type switch validation (percentage/flat/bogo/min-value), date-range guard, active/inactive toggle.

Use the existing `src/test/mock-supabase.ts` harness; no new infra needed. Target: each page hits the same green-check threshold as Orders (~5–8 specs).

## 4. Verification

- Run `bunx vitest run` — all green.
- `rg "console\." src -g '!**/*.test.*' -g '!**/ErrorBoundary*'` returns 0.
- `rg ": any\b|as any\b" src -g '!**/*.test.*' -g '!src/integrations/supabase/types.ts' | wc -l` < 60.
- Re-run security scan — confirm 0 findings.

## Files touched

```
src/utils/{shareWhatsApp,exportPdf,activityLog}.ts
src/lib/offline-store.ts
src/context/{DataContext,data-utils}.ts
src/context/domains/{useOrdersDomain,useBillingDomain,useTargetsDomain}.ts
src/pages/{AdminErrors,Company,NotFound}.tsx
src/components/{ErrorBoundary,PageErrorBoundary}.tsx
src/pages/{Stock,Targets,Schemes}.test.tsx   (new)
eslint.config.js                              (no-console rule)
```

## Order of operations

1. Console cleanup + ESLint rule (~10 min)
2. Type pass on mutation paths (~15 min)
3. Three new test files (~20 min)
4. Verify + final scan (~5 min)

~50 minutes total. After this, build quality should land at **9/10** and you're cleared to publish.
