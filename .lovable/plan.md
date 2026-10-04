# Activity, audit and notifications

Designed with input from Astra. Goal: the owner sees every action in the business, who did it, what changed, and a daily picture of orders made, orders that failed, money in and money out.

## What exists today
- The app writes an activity entry from the phone or computer after some actions. If that step fails, nothing is recorded, and payments, GST bills, credit notes, returns and team changes are mostly not recorded at all.
- The bell shows simple alerts (mostly "credit risk" and "order placed"), with no grouping or links.

## What we will build

### 1. Record every action on the server (can't be skipped or edited)
- The database records an entry in the same step as each change. If the change saves, the entry saves; if it fails, neither does.
- Covers: orders (made, edited, sent, delivered, cancelled, deleted), GST bills, payments received and cancelled, returns and credit notes, buying (bills, returns, supplier payments), stock changes, dealers, products, offers, godowns, targets, shop visits, team invites and permission changes, company settings.
- Each entry stores who, when, what, and the before and after values for edits ("Credit limit ₹50,000 → ₹80,000").
- Nobody, including the owner, can edit or delete entries.
- Each entry is tagged as money in, money out or neither, with its amount.

### 2. Record failed attempts
- When an order, payment, send-and-bill or return is refused (credit limit, out of stock, no permission, connection lost), the app records a "failed" entry with the reason in plain words.
- A connection drop is shown as "Not sure if saved" rather than "Failed", because the save may have gone through.
- Honest note: failures are recorded by the phone or computer, so a failure while fully offline may not reach the log.

### 3. New "Activity" page (owner and managers)
- Top summary for a chosen period (Today, This week, This month, custom; India time):
  orders made, orders failed, money in, money out, net.
- Timeline below, filterable by person, type (Orders, Money, Stock, Buying, Team, Settings), dealer, and "failed only".
- Tap an entry to see the before/after changes and jump to the order, bill or dealer.
- Download as CSV/Excel/PDF using the existing report exports.
- Also appears as an "Activity" report in Reports.

### 4. Better bell
- Important events only: big orders, failed orders, money received, money paid out, credit notes, low stock, team and permission changes.
- Groups repeats ("5 orders placed by Ravi"), unread count, "Mark all read", tap to open the item, "See all activity" link.
- Who sees what: owner sees everything; others see only what their access already allows (for example, no money alerts without money access).

## Out of scope for now
- Email/WhatsApp alerts and daily digest (needs an email domain).
- Undo from the activity log.
- Keeping copies outside the app for legal archiving.

## Technical details
- Extend `activity_log` (additive columns): `source` ('db'|'client'), `outcome` ('ok'|'failed'|'unknown'), `money_direction` ('in'|'out'|null), `amount numeric`, `before jsonb`, `after jsonb`, `changed_fields text[]`, `request_id`. Indexes on (company_id, created_at desc), (company_id, entity_type, entity_id), (company_id, money_direction, created_at).
- One generic SECURITY DEFINER trigger function `tg_audit_row()` attached AFTER INSERT/UPDATE/DELETE to the business tables; actor from `auth.uid()` (null = "System"); skips noise columns (`updated_at`, aggregate counters like `total_sold`, `outstanding_amount`). Money direction set by table: invoice_payments posted = in, voided = reversal; supplier_payments posted = out; credit_notes = out (credit).
- Existing client `log()` calls kept only for failure/attempt entries (`source='client'`, `outcome='failed'|'unknown'`) via a new RPC `log_failed_attempt` that stamps company and user server-side and caps text length; successes no longer double-logged.
- RLS: activity_log readable by `manage_team` or `see_money` holders; money rows hidden from users without `see_money`; no UPDATE/DELETE for anyone (already denied).
- Notifications: a trigger on activity_log fans out rows into `notifications` per recipient by capability, with a `group_key` column for bundling and `link` column for deep links; unique (user_id, activity_id).
- Summary numbers come from one RPC `activity_summary(p_from, p_to)` computed from the canonical tables (orders, invoice_payments, supplier_payments) so they match Reports; failed count from activity_log.
- New route `/activity` (lazy), nav item via nav-config, report in `src/lib/reports/registry.ts`, and Vitest tests for the summary maths plus a rollback SQL test that each covered table writes exactly one audit row.
