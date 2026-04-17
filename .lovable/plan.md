

## Phase 4 — Data Integrity, RLS, RBAC & Edge Functions Audit

### Scope
1. **DB trigger fix (carry-over from Phase 3)** — `refresh_entity_aggregates` uses gross `total` for `outstanding_amount` and `total_value`. Should be `total - scheme_savings` to match Dashboard/Billing/Reports.
2. **RLS audit** — verify every table has appropriate policies; flag overly permissive ones.
3. **RBAC enforcement** — accountant restrictions on stock/products/godowns; super_admin gates on schemes/roles. Verify client-side guards match server-side policies.
4. **Edge functions** — `seed-demo-account`, `seed-test-accounts`: verify CORS, JWT handling, input validation, and that they're not callable by random users in prod.
5. **Auth security** — run linter, check for leaked-password protection, OTP expiry.
6. **Profiles policy review** — current policies look complex (self-update with company_id-locked check); validate they actually prevent privilege escalation.

### Approach
- Run `supabase--linter` + `security--run_security_scan` in parallel to surface known issues.
- Read the two edge functions.
- Apply migration to fix the aggregates trigger (uses `total - COALESCE(scheme_savings, 0)`).
- Spot-check client RBAC guards (Stock page, Schemes page) against RLS.

### Out of scope
- Restructuring RLS architecture (only fix concrete issues).
- Adding new auth providers.

### Deliverable
`PHASE 4 COMPLETE` with: linter findings, RLS issues found/fixed, edge function status, trigger fix applied, files changed.

