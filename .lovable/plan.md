# Salesperson Attribution & Shop Acquisition — Final Six-Phase Plan

Six separate checkpoints. Each phase: build only that phase, run its tests and a regression check, report files / database changes / functions / test results, then stop for approval. No phase is combined or skipped. Existing workflows and permissions stay as they are unless the phase names the change.

## Fixed rules (all phases)
- **Acquired By** = who brought the shop in. Historical, set once, not editable in normal screens.
- **Assigned Salesperson** = who looks after the dealer now. Changeable by authorised users only.
- **Order Salesperson** (`orders.salesperson_id`) stays the only source for revenue, targets, bills, GST and commissions.
- All new fields are optional (nullable, `ON DELETE SET NULL`). No backfill of old records. Empty values show as "Direct Onboarding", "Unassigned" or "Direct Lead".
- No changes to booking, dispatch/billing, tax, payment, balance or stock functions.

---

## Phase 1 — Database Foundation
Schema only. No function logic changes.
- `salespersons.user_id` (link to a login), unique per company when set.
- `shop_prospects.found_by_salesperson_id`.
- `distributors.acquired_by_salesperson_id`, `distributors.assigned_salesperson_id`, `distributors.acquisition_date`.
- `shop_visits.visited_by_salesperson_id`.
- Indexes on the new dealer and prospect columns.
- Same-company guard triggers so a record can only link to its own business's salespeople (matches existing order-link rule).
- Write rules: `acquired_by_salesperson_id` / `acquisition_date` blocked from direct client edits once set; `assigned_salesperson_id` editable only by users with `see_all_dealers` or `manage_team`; `salespersons.user_id` editable only with `manage_team`.
- Checks: row counts and sums on dealers, orders, invoices, payments, visits and prospects identical before and after; existing tests pass; audit trigger still records dealer edits.

## Phase 2 — Identity Mapping & Shop Visit Integrity
- `useCurrentSalesperson()`: matches only `salespersons.user_id = signed-in user`. No email or name guessing. Otherwise returns "not linked".
- Sales Team page: owners/managers can link a team login to a salesperson.
- Visit records clearly show **visitor name, actual visit date and time** (e.g. "Ravi · 19 Nov 2026, 12:30 PM"), read from existing `created_by_name` and `created_at`, which stay the audit source. New visits store `visited_by_salesperson_id` only when the user is linked; never blocks saving.
- Tests: linked user resolves; same email without link → not linked; signed-out → not linked; visit display formatting in IST.

## Phase 3 — Prospect Acquisition & Conversion
- New-shop form records who found it: prefilled for linked salespeople, pick from roster or leave as "Direct Lead" for others.
- Update `convert_prospect_to_dealer_atomic` (keeps company check, row lock, security): copies `found_by` into the dealer's Acquired By and initial Assigned Salesperson, sets acquisition date. A prospect already converted cannot create a second dealer; attribution is never lost.
- Tests: conversion carries attribution; no-finder conversion gives empty fields; repeat/concurrent conversion makes one dealer only.

## Phase 4 — Dealer Acquisition & Assignment
- Add Dealer: optional **Assigned Salesperson** only. Office onboarding does **not** create an acquisition credit — Acquired By stays empty ("Direct Onboarding").
- Edit Dealer / Dealer page: Assigned Salesperson editable by authorised users; Acquired By shown read-only ("Acquired by Ravi on 12 Nov 2026" or "Direct Onboarding").
- Reassigning changes only the assignment; history recorded in Activity.
- Tests: reassignment leaves Acquired By untouched; restricted roles cannot reassign; legacy dealers show the empty labels.

## Phase 5 — Order Salesperson Prefill
- New Order: choosing a dealer prefills the Sales Person box with the assigned salesperson; stays fully editable per order. Never overwrites a choice the user already made.
- Changing it on the order does not change the dealer's assignment.
- Tests: prefill / no prefill / manual override; order totals, booking call and saved salesperson unchanged.

## Phase 6 — Sales Team Metrics & Reports
- Sales Team list and detail: separate counts for **Shops Acquired**, **Prospects Found**, **Assigned Accounts**.
- Reports: separate "Dealer Coverage & Acquisition" section with counts only.
- Existing revenue, order and target figures untouched.
- Verification: record revenue/order/target figures per salesperson before the phase and confirm identical afterwards; count logic unit tests.

---

## Technical notes
- One migration per phase that needs one (Phase 1 schema, Phase 3 conversion function). Phases 2, 4–6 are app-side, except permission checks already set in Phase 1.
- Files mainly touched: `useCurrentSalesperson.ts` (new), `data-types.ts`, `data-utils.ts`, `useDealersDomain.ts`, `useShopVisits.ts`, `VisitDialogs.tsx`, `DealerVisitsPanel.tsx`, `ShopVisits.tsx`, `Distributors.tsx`, `DealerDetail.tsx`, `Salespersons.tsx`, `SalespersonDetail.tsx`, `NewOrder.tsx`, `Reports.tsx`.
- Rollback: new columns are optional and unused by money logic, so each phase can be reverted without affecting bills or balances.
