# Ledge Ops — internal admin panel (foundation release)

A private control room for you: every business that has signed up, every person inside it, what they're actually using, and whether anything is broken. Built as a foundation so we can keep adding to it, not a one-off screen.

## Who can get in

Only you. Access is tied to your own Ledge login on **business.rahulps@gmail.com** — not a separate `admin` username.

Why: a fixed username and password that lives in the app is the single biggest way internal admin tools get breached, and anyone who ever sees that password has permanent full access to every customer's data. Tying it to your existing account means the same protection your normal login already has, and I can revoke or add people in seconds without a code change.

If you still want a second barrier, I'll add a passphrase step **on top** of your login — you type it once per session, and it lives in the server's secret store, never in the code. Say the word and I'll set it to the one you gave me.

## What the first version shows

Five sections, all read-only in this release:

1. **Overview** — businesses signed up, new this week, active in the last 7/30 days, total orders and billed value across the whole platform, trials ending soon.
2. **Businesses** — searchable list: name, owner, signed-up date, plan/trial end, people count, orders, bills raised, money tracked, last activity. Click one for a detail page with its team, usage over time, and recent errors.
3. **People** — every registered user across all businesses: name, email, which business, role, signed up, last seen. Search by email.
4. **Health** — the existing error log, but across all businesses instead of one, with the business name attached, plus sign-up and login failures.
5. **Activity feed** — a live-ish stream of what's happening platform-wide (orders booked, bills raised, payments taken), so you can tell at a glance whether the product is being used.

## What it deliberately does NOT do yet

No suspending businesses, no editing customer data, no signing in as a customer, no deleting anything. Those are powerful and each needs its own audit trail — they belong in the next release once the foundation is proven. The groundwork laid here (staff list, permission checks, audit table) is exactly what they'll plug into.

## How it's built to last

Enterprise admin tools in 2026 are judged on four things, and this release does all four from day one:

- **Separate identity plane.** Platform staff are a different concept from customer roles. A business owner being "super admin" of their own workspace gives them zero reach into Ledge Ops.
- **Enforced in the database, not the screen.** Hiding a menu is not security. Every cross-business read is gated inside the database itself, so even a crafted request from a customer's browser returns nothing.
- **Everything is logged.** Every page you open and every record you look at in Ops writes an audit row. When the panel gains write actions later, the audit trail is already there.
- **Read-only by default.** The dangerous surface stays closed until it's specifically needed.

## Technical section

**Database**

- New `public.platform_staff` (`user_id`, `level` — `owner` | `viewer`, `created_at`), seeded with your user id only. GRANTs + RLS: readable only by staff, never writable from the client.
- `public.is_platform_staff(_user_id uuid)` — `SECURITY DEFINER STABLE`, used by every Ops policy and RPC. Added to the EXECUTE allowlist from migration 0005.
- New `public.platform_audit_log` (`actor`, `action`, `target_type`, `target_id`, `metadata`, `created_at`) — insert-only, staff-read.
- Cross-tenant reads exposed as `SECURITY DEFINER` RPCs rather than loosened table policies, so no existing customer-facing policy changes:
  - `ops_platform_summary()` — the overview counters, one round trip.
  - `ops_list_companies(p_search, p_limit, p_offset)` — company + owner + aggregate usage, keyset-friendly.
  - `ops_company_detail(p_company_id)` — team, usage series, recent errors.
  - `ops_list_users(p_search, p_limit, p_offset)` — profiles joined to companies and roles.
  - `ops_recent_errors(p_limit)` and `ops_recent_activity(p_limit)`.
  - Each begins with an `is_platform_staff(auth.uid())` guard that raises, and writes an audit row.
- `error_log` and `activity_log` read paths stay untouched for customers; Ops reads through the RPCs.

**Frontend**

- Routes under `/ops` (`/ops`, `/ops/businesses`, `/ops/businesses/:id`, `/ops/people`, `/ops/health`), lazy-loaded, behind a new `RequireStaff` guard that mirrors `RequireCapability`'s "wait until known, then decide" behaviour — no flash of "no access".
- New `useIsPlatformStaff()` hook (react-query, 5 min stale) calling `is_platform_staff`.
- New `OpsLayout` — its own shell, visually distinct from the customer app (deliberately plain, dark topbar labelled "Ledge Ops") so it's never mistaken for a customer screen. Not linked from anywhere in the customer app or sidebar.
- Data via react-query against the RPCs; existing `handleSupabaseError`, `PageHeader`, table and `StatusBadge` primitives reused. Semantic tokens only.
- Optional passphrase gate (if you want it): a `OPS_PASSPHRASE` server secret checked by an edge function that returns a short-lived session flag; nothing hardcoded in the bundle.

**Out of scope for this PR:** write actions, impersonation, billing/subscription management, email sending, a standalone admin app.

## Verification

- Typecheck, full test run, build.
- Signed in as you: every Ops page loads with real platform-wide numbers, and the overview counters reconcile against direct database counts.
- Signed in as a customer owner (a different workspace): `/ops` refuses, and every Ops RPC called directly returns a permission error.
- Audit rows appear for each Ops page view.
