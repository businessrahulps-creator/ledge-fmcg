---
name: Ledge Ops internal admin panel
description: /ops platform admin — platform_staff identity plane, ops_* SECURITY DEFINER read RPCs, platform_audit_log, shared admin login at /ops/login, read-only v1
type: feature
---

Internal control room for the Ledge team, separate from customer roles.

- **Access**: `public.platform_staff` (user_id, level owner|viewer). Two rows: Rahul (`business.rahulps@gmail.com`, owner) and the shared team login (viewer). A customer's `super_admin` role gives zero reach here.
- **Shared team login**: username `admin`, password `getledge200`, backed by a real auth account `admin@ops.getledge.in` (created via sign-up with `auto_confirm_email` flipped on and straight back off). `/ops/login` maps `<username>` → `<username>@ops.getledge.in` and calls `signInWithPassword`, then re-checks `is_platform_staff` before letting the visitor in. No password lives in the code or bundle. Accepted tradeoff: the audit trail says "admin" for the whole team — replace with named logins before any write action ships.
- **Boundary is the database**: every cross-tenant read is a `SECURITY DEFINER` RPC starting with `ops_guard(...)`, which raises for non-staff and writes to `public.platform_audit_log`. `RequireStaff` is convenience only: signed out → `/ops/login`, signed-in customer → `/404` (never advertises the tool).
- **RPCs**: `is_platform_staff`, `ops_platform_summary`, `ops_list_companies`, `ops_company_detail`, `ops_list_users`, `ops_recent_errors`, `ops_recent_activity`. On the migration-0005 EXECUTE allowlist (`ops_guard` itself is NOT granted to authenticated). Staff accounts are excluded from `ops_list_users` and the summary's user counts.
- **Frontend**: `/ops/login` (public), `/ops`, `/ops/businesses`, `/ops/businesses/:id`, `/ops/people`, `/ops/health`, `/ops/activity`. Own shell (`OpsLayout`, dark primary topbar "Ledge Ops · internal", Sign out always, "Back to app" only when the staff user has a company). Never linked from the customer app.
- **v1 is read-only on purpose.** Deferred: per-person team logins + invites, 2FA/passphrase, suspend/extend trial, impersonation, billing management.

Migrations: `drizzle/migrations/0010_platform_ops_foundation.sql`, `0011_ops_exclude_platform_staff_from_user_counts.sql`.
