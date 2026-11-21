# Master Owner Governance — Implementation Plan

Planning only. Nothing is built until you approve. Items marked **[APPROVAL]** need your decision; items marked **[HIGH RISK]** change live data or security.

## What changes for people

- Each business has exactly one **Master Owner**. Other Owners stay Owners and keep every operational power they have today (money, stock, billing, team invites for non-owner roles, access toggles for non-owners).
- Only the Master Owner can promote someone to Owner, demote an Owner, or remove an Owner.
- The Master Owner cannot demote or remove themselves. They must first **hand over** Master Owner to another member.
- Handover happens in Settings → Team, with a typed confirmation, and is recorded in Activity.
- If a Master Owner is lost (left, unreachable, business sold), only Ledge platform staff can reassign it, through Ops, with a reason logged.

## Current state (verified)

- `companies` has no owner field. All `super_admin` users are equal.
- `change_member_role_atomic` and `delete_member_atomic` block every action against an Owner. There is no server-side last-owner check.
- `send_team_invite` / `accept_team_invite` reject `super_admin` invites (no change needed).
- `setup_new_company` inserts the creator as `super_admin` and only updates an existing profile.
- Live data: 9+ businesses have exactly one Owner; **anaar has two** (Rajan P S and Swetha).
- Team UI: `TeamRoster.tsx` hides menus on all Owner cards; `JobPickerSheet.tsx` says promotion "can't be undone".

## Phase 1 — Database foundation

Migration `master_owner_foundation`:
- Add `companies.master_owner_user_id uuid NULL` (plain UUID, no FK to auth, per project rules) + index.
- Trigger `tg_companies_protect_master_owner`: blocks any client UPDATE of this column; only the RPCs below (via a transaction-local flag) may change it. Also validates the user is a `super_admin` member of that business.
- Helper `is_master_owner(_user uuid default auth.uid()) returns boolean` (SECURITY DEFINER, `search_path=public`, granted to `authenticated`).
- Backfill: for each business with **exactly one** Owner, set that Owner as Master Owner (deterministic, no guessing).
- **anaar is left NULL.** No assumption by creation date. [APPROVAL] You choose Rajan P S or Swetha; I apply it as a separate, logged one-row change after you confirm.
- Column stays nullable for now; a later migration adds a check only after every business has one.

Rollback: column/function are additive; dropping them restores today's behaviour (RPCs from Phase 2 would be reverted together).

## Phase 2 — Server rules (RPCs) [HIGH RISK: security]

All functions: SECURITY DEFINER, `SET search_path = public`, `REVOKE ALL FROM public/anon`, `GRANT EXECUTE TO authenticated`. Each locks the company row (`SELECT ... FOR UPDATE` on `companies`) first, then re-reads caller role/Master status after the lock to prevent races.

1. **`change_member_role_atomic`** (update)
   - Target is non-owner and new role is non-owner → unchanged rules (`manage_team`).
   - Promote to Owner, or demote an Owner → caller must be Master Owner.
   - Target is the Master Owner → always refused ("Hand over Master Owner first").
   - Self changes still refused.
2. **`delete_member_atomic`** (update)
   - Removing an Owner → Master Owner only. Removing Master Owner → refused.
   - Also clear `salespersons.user_id` link for the removed user in the same business (gap found in investigation).
3. **`transfer_master_owner_atomic(_new_user uuid, _confirm_text text)`** (new)
   - Caller must be current Master Owner; target must be a same-business member, not self.
   - If target isn't an Owner yet, promote to `super_admin` in the same transaction (custom access cleared, as today).
   - Previous Master Owner stays an Owner (can later be changed by the new Master Owner).
   - Idempotent: repeating the same transfer returns success without a second log.
4. **`platform_reassign_master_owner(_company uuid, _new_user uuid, _reason text)`** (new)
   - `ops_guard()` platform staff only; reason required; writes `platform_audit_log` and the business's activity history.
5. **`setup_new_company`** (update): sets creator as Master Owner; also inserts a profile if missing (fixes rejoin-then-create gap).
6. **`set_member_access_atomic`**: unchanged (already blocks Owners).
7. **Invites**: unchanged — Owners still cannot be invited directly; they are promoted after joining.

RLS: no new tables. `companies` update policy unchanged except the trigger protects the new column. `manage_team` capability unchanged, so regular Owners keep all operational admin powers.

## Phase 3 — Audit and alerts

- Role changes, removals, transfers and platform reassignments write `activity_log` rows (existing identity stamping keeps the real person). Fields: actor, target, old/new role, old/new Master Owner, reason (platform only).
- `tg_activity_notify` already fans out bell alerts; mark transfer/reassign as `important` for all Owners.
- No historical orders, bills, payments or activity are touched. Removed users' history stays (it never linked to profiles).

## Phase 4 — Team screen and handover flow

Files: `TeamRoster.tsx`, `JobPickerSheet.tsx`, `useTeamRoster.ts`, `jobs.ts`, `RoleAvatar.tsx` (label only), `src/hooks/useMyCapabilities` or equivalent (add `isMasterOwner`).
- Labels: "Master Owner" badge (crown-free, monochrome style) vs "Owner".
- Master Owner sees the action menu on other Owners: Change job, Remove. Confirmation dialog names the person.
- Regular Owners see Owner cards locked with hint "Only the Master Owner can change Owners."
- Master Owner's own card: locked, with "Hand over Master Owner" button.
- Handover dialog: pick a member → explains what changes → type business name to confirm → calls `transfer_master_owner_atomic`.
- Replace "can't be undone" copy with accurate text.
- Ops (`OpsBusinessDetail.tsx`): show Master Owner; staff-only "Reassign Master Owner" with required reason.
- If a business has no Master Owner yet (anaar until you decide): banner for Owners "Ledge support will confirm your Master Owner"; Owner-tier changes stay blocked for everyone.

## Phase 5 — Testing

Automated (vitest, alongside existing team tests):
- Pure rule helper `canManageMember(caller, target)` mirroring the SQL, one test per rule.
Live SQL/RPC checks with test users in two businesses:
- Regular Owner: can change Manager→Accountant; cannot promote to Owner, demote/remove Owner, touch Master Owner.
- Master Owner: can promote, demote, remove Owners; cannot self-demote/remove; can transfer; old Master becomes Owner.
- Transfer to user in another business → refused. Platform reassign by non-staff → refused.
- Direct `UPDATE companies SET master_owner_user_id` from the app → refused.
- Concurrency: two simultaneous transfers / transfer + demote → one wins, the other gets a clear error; never zero or two Master Owners.
- Rejoin: removed user re-invited works; removed user creating a new business works.
Browser (Playwright) on desktop and phone: labels, menus, handover dialog, regular-Owner locked view, Ops reassign.
Full suite must stay green (currently 610).

## Order and dependencies

```text
Phase 1 (DB + backfill) -> [your anaar decision] -> Phase 2 (RPCs) -> Phase 3 (audit)
                                                 -> Phase 4 (UI, needs Phase 2) -> Phase 5
```
I'll pause for "go" between phases, as before.

## Risks

- **[HIGH RISK]** Phase 2 replaces live team RPCs; a bug could lock out team management. Mitigation: tests before release, old function bodies kept in migration history for quick revert.
- **[HIGH RISK]** Backfill writes to live `companies` rows (single-Owner businesses only). Reversible by setting the column back to NULL.
- anaar stays without a Master Owner until you decide; Owner-tier changes there are blocked meanwhile.
- No data is deleted anywhere in this plan.

## Decisions needing your approval

1. Who is anaar's Master Owner (Rajan P S or Swetha)?
2. Confirm the previous Master Owner stays an Owner after handover (recommended), rather than being dropped to Manager.
3. Confirm handover confirmation = type the business name.
