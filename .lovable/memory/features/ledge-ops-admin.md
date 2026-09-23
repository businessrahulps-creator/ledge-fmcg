---
name: Ledge Ops internal admin panel
description: /ops platform admin — platform_staff identity plane, ops_* SECURITY DEFINER read RPCs, platform_audit_log, read-only v1
type: feature
---

Internal control room for the Ledge team, separate from customer roles.

- **Access**: `public.platform_staff` (user_id, level owner|viewer). Seeded with Rahul only (`business.rahulps@gmail.com`, `b289b014-bd4a-4d5d-b7c6-3cceee5a0fb9`). A customer's `super_admin` role gives zero reach here. No shared username/password — rejected deliberately as a breach vector.
- **Boundary is the database**: every cross-tenant read is a `SECURITY DEFINER` RPC starting with `ops_guard(...)`, which raises for non-staff and writes a row to `public.platform_audit_log`. The `RequireStaff` route gate is convenience only (redirects to 404, never advertises the tool).
- **RPCs**: `is_platform_staff`, `ops_platform_summary`, `ops_list_companies`, `ops_company_detail`, `ops_list_users`, `ops_recent_errors`, `ops_recent_activity`. Added to the migration-0005 EXECUTE allowlist convention (`ops_guard` itself is NOT granted to authenticated).
- **Frontend**: `/ops`, `/ops/businesses`, `/ops/businesses/:id`, `/ops/people`, `/ops/health`, `/ops/activity`. Own shell (`OpsLayout`, dark primary topbar "Ledge Ops · internal"), never linked from the customer app or sidebar. Data via `src/pages/ops/ops-api.ts`.
- **v1 is read-only on purpose.** Deferred: suspend/extend trial/resend invite (each needs its own audit action), support impersonation, billing management, standalone admin app. The staff table, guard and audit log are the plug-in points.
- Optional extra passphrase gate (server secret + edge function) was offered and not built.

Migration: `drizzle/migrations/0010_platform_ops_foundation.sql`.
