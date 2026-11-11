# Phase 2 — data-preservation gate before decimal migration

## Status and approval boundary
The earlier migration request was cancelled before execution. A fresh schema read confirms all five quantity columns in the four affected tables are still INTEGER. No code or database changes were made during this verification.

**Do not execute until a recent backup is confirmed, the checks below are complete, and the owner explicitly approves execution.** Approving this proposal authorises preparation only while the backup gate remains unresolved. Stop after Phase 2; Phase 3 requires a separate review and approval.

The four tables contain **five**, not four, affected columns: both quantity and restocked_quantity in credit_note_lines must preserve fractions.

## 1. Backup gate — not yet satisfied
Lovable Cloud provides daily database backups, but the backup inventory cannot be read with the available tools. No recent restorable backup has been verified.

- Owner: open **More → Database → Manage → Backups** and provide the newest snapshot timestamp in UTC.
- Prefer a fresh full database export before execution: **More → Database → Manage → Settings → Export data → Database → Export → Start export**. Confirm download completion rather than merely export initiation.
- A backup restores the same database in place, including schema. Later writes are lost, and restoration interrupts availability for a few minutes. Storage files are not included. Daily backups are not point-in-time recovery.
- Existing queries, sums and fingerprints are preservation evidence, **not a restorable backup**.

## 2. Verified before-results — 11 November 2026, approximately 06:55 UTC

| Column | Rows | SUM | Values changed by proposed cast |
|---|---:|---:|---:|
| stock_items.quantity | 452 | 38,433,271 | 0 |
| stock_movements.delta | 3,999 | 38,433,372 | 0 |
| claim_lines.quantity | 65 | 1,239 | 0 |
| credit_note_lines.quantity | 18 | 646 | 0 |
| credit_note_lines.restocked_quantity | 18 | 539 | 0 |

Every existing value was compared with its numeric(18,6) cast. **Zero differences**; no affected values are null. Claim and credit-note parent checks found zero orphan lines.

### Per-business baseline
Business references below are the first eight characters of the business UUID; fresh execution evidence will retain full identifiers internally. Each cell is **row count / SUM**. A dash means zero rows in that group.

| Business reference | Stock | Movements | Claims | Credit quantities | Restocked |
|---|---:|---:|---:|---:|---:|
| 08f972d5 | 2 / 16 | 3 / 32 | — | — | — |
| 0e77a71e | 3 / 101,060 | 24 / 101,145 | 1 / 1 | 1 / 1 | 1 / 0 |
| 1574c71c | 86 / 37,855,365 | 258 / 37,855,365 | — | — | — |
| 19b241b3 | 17 / 10,047 | 60 / 10,047 | 2 / 13 | 2 / 13 | 2 / 2 |
| 22312ff7 | 1 / 100 | 1 / 100 | — | — | — |
| 328e762b | 3 / 100,175 | 12 / 100,175 | 4 / 615 | 4 / 615 | 4 / 525 |
| 4d8ecc96 | 104 / 13,031 | 1,392 / 13,031 | 8 / 12 | — | — |
| 5489947b | 2 / 200 | 2 / 200 | — | — | — |
| 58b064ab | 4 / 306,155 | 50 / 306,155 | — | — | — |
| 65cacbde | 229 / 47,022 | 2,196 / 47,022 | 50 / 598 | 11 / 17 | 11 / 12 |
| 99d05115 | 1 / 100 | 1 / 100 | — | — | — |

### Additional baseline evidence
Current ID-to-quantity fingerprints (MD5, diagnostic only):
- stock_items: `9a9829620ac2d084f51f52a650373eed`
- stock_movements: `6f9766699e920061daa35506616b9972`
- claim_lines: `4285065d00dd4ac9720cf4871569fdc0`
- credit_note_lines, both quantities: `2569894dc1cdbff8030f2ea36af64cfe`

These initial fingerprints use integer text. Post-migration fingerprints must use the same canonical numeric representation, not fixed-scale decimal text. Exact per-row comparisons inside the transaction are the primary proof; matching sums alone cannot prove preservation.

Refresh all baselines immediately before execution because customers may continue working after this initial read.

## 3. Dependency audit findings
Live definitions and catalog dependencies were inspected; no public view or materialized view referencing these tables was found.

| Object / workflow | Verified behaviour and risk | Required action for this migration |
|---|---|---|
| Quantity checks | stock_items.quantity >= 0; credit_note_lines.quantity > 0 | Preserve and recheck; decimal comparison remains valid |
| Other checks | stock threshold, movement kinds, return kinds | Preserve exactly; unrelated to the type change |
| Primary/unique indexes | IDs; stock product/godown and company/product/godown uniqueness | Preserve definitions and validity; no quantity-index expression found |
| Lookup/idempotency indexes | Claim parent, note parent, stock company/product/godown, movement lookup/idempotency | Preserve definitions and uniqueness |
| Foreign keys | Company, product, godown, claim/note parent, invoice line, product unit; incoming ledger links | No quantity foreign key found; preserve all links and actions |
| Defaults / nullability | Existing defaults and column rules are catalog dependencies | Capture and compare; do not change |
| trg_stock_items_updated_at / update_updated_at | Row UPDATE timestamp trigger | Type rewrite is not a row UPDATE; verify timestamps unchanged |
| trg_audit_row / tg_audit_row | Stock movement INSERT audit; reads delta as numeric | Already decimal-safe; preserve definition and existing Activity |
| dispatch_and_bill_order_atomic | Decimal stock comparison; subtraction directly against quantity | Preserve; existing whole-unit orders remain unchanged |
| preview_dispatch_impact | Numeric required/current/after quantities | Preserve |
| adjust_stock_atomic | Numeric total and delta, six-decimal validation | Preserve |
| _buying_move_stock | Whole-unit input, %ROWTYPE current stock; adds directly to quantity | Retains existing fractional balance; buying inputs remain whole units |
| record_purchase_bill_atomic / return_purchase_atomic / cancel_purchase_bill_atomic | Whole-unit buying inputs; stock changes through _buying_move_stock | Preserve buying documents and money logic |
| restore_stock_on_deduction_delete | Adds whole deduction to current quantity directly | Preserves fractional residue; do not widen deduction quantities |
| reverse_dispatch_for_order | Uses restoration trigger; creates matching whole-unit movement | Preserve; existing billed-order reversal prohibition remains |
| delete_order_atomic | Pending/unbilled/unpaid checks; deduction deletion invokes restoration | Preserve |
| cancel_order_atomic | Cancels pending orders and handles advance choice; does not restore dispatched stock | Preserve; no new cancellation behaviour |
| delete_godown_atomic | Locks stock and rejects any nonzero quantity; integer variables count rows only | Decimal-safe; preserve |
| resolve_claim_atomic | Changes claim status only | Preserve approval and permissions |
| record_return_and_credit_atomic | good/damaged input and prior-return accumulator are integer; existing stock addition itself is direct | Phase 2 must not enable fractional returns; Phase 3 replaces the accumulator/conversion logic before fractions are accepted |
| dispatch_order_atomic (retired) | Reads current stock into integer, which would round fractions | authenticated and anon EXECUTE are both false; leave retired and never restore this path |
| tg_return_ledger_guard | Numeric processed sum and bill-line limit | Preserve during this type migration; outstanding ledger-link/concurrency test coverage remains part of Phase 2 review and later return work |
| Row security, grants, realtime publication, composite row types | Policies read business/parent IDs; stock_items is in realtime publication | Capture catalog definitions and actual ACLs; preserve access and publication membership; refresh generated app types |

Stored function bodies were searched separately because PostgreSQL dependency catalogs do not track every textual reference inside PL/pgSQL. No functions are to be rewritten by this five-column migration.

### Existing risks, not repairs
- Four stock/movement mismatches were present in Phase 0. Do not correct them during migration; verify no new mismatch appears.
- Forty-two unlinked legacy claims remain excluded under the approved default; no reassignment or financial change.
- The existing return function does not yet write new snapshots or the ledger. Phase 3 must reconcile any intervening whole-unit returns before making the ledger authoritative.
- Fractional-return end-to-end checks, concurrent returns and all ledger refusal cases are not yet complete. Column widening alone is not feature readiness.

## 4. Locking and availability
INTEGER → NUMERIC requires an **ACCESS EXCLUSIVE** lock on each affected table and a table rewrite; PostgreSQL may rebuild related indexes. Reads and writes to these tables can wait until commit. This is not guaranteed zero downtime.

Verified total sizes: stock_items 552 kB; stock_movements 2,280 kB; claim_lines 96 kB; credit_note_lines 48 kB. These are small, but lock waits and active traffic determine actual duration; no exact duration is promised.

- Agree a quiet window; avoid stock, dispatch and return operations during it.
- Use transaction-local lock_timeout = 5 seconds and statement_timeout = 60 seconds. Abort cleanly rather than wait indefinitely.
- Acquire all four table locks in a fixed order before taking the execution baseline or altering any column. Failure to obtain a lock aborts the whole transaction.

## 5. Controlled execution — only after the safety gate and explicit approval
Use the Lovable database migration tool, which executes its statements in a transaction. Do not add manual BEGIN/COMMIT around it.

Within that transaction:
1. Set local timeouts and lock the four tables in a fixed order.
2. Capture temporary full-row snapshots, grouped row counts/SUMs, and schema/access signatures. Temporary snapshots are verification aids, not backups.
3. Assert every current value equals its numeric(18,6) cast, all columns are the expected current type, and dependent checks are valid.
4. Change **only** the five listed columns using explicit numeric(18,6) casts. Combine both credit_note_lines changes into one table alteration. No DELETE, no business-row UPDATE, no rounding function, no table/column removal.
5. Compare all original IDs and full row contents against the snapshots in both directions; numeric values compare by exact value, independent of displayed trailing zeros.
6. Compare per-business and global counts/SUMs, defaults/nullability, constraints, index validity, triggers, function definitions, policies, ACLs and publication membership.
7. Raise an exception on any difference; transaction rollback restores the pre-migration schema and data. Commit only if all assertions pass.

Type widening can represent every signed 32-bit integer exactly: numeric(18,6) allows 12 integer digits, whereas current integer columns need at most 10. The live per-value cast check also found zero differences. This is verified cast safety, not an already-executed migration result.

## 6. After-results and Phase 2 report
**After-results: pending — migration has not run.**

After commit:
- Read the live column types and precision; confirm numeric(18,6) on exactly five columns.
- Repeat global/per-business totals and canonical fingerprints. Attribute any later legitimate writes separately; the in-transaction exact comparison remains decisive.
- Confirm no new stock/history mismatch or over-returned line and no lost historical snapshots/ledger rows; verify money totals unchanged.
- Run existing quantity, stock-domain, billing-domain, order-billing, receivables and thermal-receipt regression tests. Report actual pass/fail counts, not planned tests as completed.
- Verify stock readback through the signed-in app without creating customer transactions; check the automatic build result. Fractional return tests remain gated on Phase 3.
- Save the before/after evidence and Phase 2 report in project documentation; update roadmap.md with this preservation gate and phase status once Build Mode permits those writes.
- Report the exact migration/generated-type/document/test files changed, functions changed (expected: none in this migration), results and residual risks. **Do not start Phase 3.**

## Rollback limits and scope
Failure before commit rolls back this migration. After successful commit, retain widened columns: narrowing after fractions exist would lose information. Hiding the unit selector is not permission to restore old whole-number readers or the retired dispatch function.

No changes to sales, invoice PDFs/printouts, pricing, GST, schemes, purchasing, approval steps, financial permissions, product master details or unrelated UI.