

## Pre-Demo Audit Plan — 5 Phases + Final Sign-off

I'll work strictly one phase at a time, replying `PHASE X COMPLETE` after each. No new features — only fixes for bugs, calculations, security, performance, and spec deviations.

### Phase 1 — Auth, Signup & Workspace
- Walk `Signup.tsx` → `setup_new_company` RPC → `NoCompanyGuard` → `AuthContext.fetchProfile` auto-recovery path.
- Verify: email confirm flow, super_admin assignment, 14-day trial (note: RPC currently sets `30 days`, spec says 14 — flag & fix).
- Audit RLS on `profiles`, `user_roles`, `companies` for cross-tenant leaks.
- Validate GSTIN/phone client-side at signup.
- Check `Login.tsx`, `ResetPassword.tsx` for missing redirectTo, frontend-only role checks.

### Phase 2 — Every Page UI/UX
- Visit every route: Dashboard, Orders, NewOrder, OrderDetail, Distributors, DealerDetail, Salespersons, SalespersonDetail, Stock, Schemes, Targets, Billing, Claims, Reports, Performance, Settings, Company, Help, About, Contact, Privacy, Terms, Refund, 404.
- Check mobile (375px) vs desktop layouts, bottom nav, sidebar, glass cards, animations, theme tokens, INR formatting consistency, skeleton loaders.
- Fix visual glitches, overflow, missing `tabular-nums`, broken empty states.

### Phase 3 — Business Flows & Calculations
- E2E: order create (atomic `insert_order_atomic`, line totals, scheme savings, confetti, notification), edit, dealer/salesperson CRUD, stock CRUD with health badges, all 5 reports + time filters.
- Audit every formula: dashboard KPIs, top-N charts, report aggregates (`reduce` chains in `Reports.tsx`, `Dashboard.tsx`, `dealerScorecard.ts`, `salespersonScorecard.ts`), stock value, outstanding, health thresholds, day-of-week filter.
- Verify Export PDF (lazy-loaded) + Export CSV against real data shape.

### Phase 4 — Security & DB Integrity
- Run `supabase--linter` + `security--run_security_scan`.
- Audit every RLS policy for `get_company_id()` correctness, missing INSERT/UPDATE policies, `SECURITY DEFINER` functions for `search_path` hygiene.
- Confirm no service_role key in client bundle, no `dangerouslySetInnerHTML` with user input, all forms validate length + type.
- Check realtime subscriptions filter by `company_id`.

### Phase 5 — Performance, PWA, Tech Debt
- Bundle audit: identify heavy imports, confirm lazy PDFs ship in separate chunks, kill unused deps.
- DataContext fetch: verify parallel queries + no N+1 + proper `.range(0, 9999)` limits.
- PWA: install prompt, offline toasts, SW update prompt fires on new deploy, asset cache invalidation.
- Stock quantity persistence bug (spec §9): trace `deductStockForOrder` + `restore_stock_on_deduction_delete` trigger for race / double-deduction.
- Cross-tab realtime sync smoke test.

### Final Phase (only on "PROCEED TO FINAL PHASE")
Full regression + polish pass + `FINAL AUDIT COMPLETE — READY FOR DEMO` summary.

### Rules I'll honor
- No new features — fixes only.
- One phase at a time, wait for next prompt between phases.
- Each phase ends with `PHASE X COMPLETE` + change list.
- Migrations only when an RLS / function fix genuinely needs DB change.
- Will use read tools to ground every fix; no speculative edits.

Starting with **Phase 1** on approval.

