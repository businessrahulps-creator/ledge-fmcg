# Fix: Irreversible self-demotion from Super Admin → Sales Manager / Accountant

## Root cause (verified)

In `src/pages/Settings.tsx` (lines ~242–266), the team-member edit dialog lets a user change **their own** role to any value, including `sales_manager` or `accountant`.

The Supabase RLS policy `Super admins can manage same-company roles` on `user_roles` requires `has_role(auth.uid(), 'super_admin')` for **both UPDATE and DELETE**. The moment a Super Admin saves a self-demotion:
- They lose `super_admin` privilege.
- They can no longer update *any* row in `user_roles` — including their own.
- If they are the only Super Admin in the workspace (the common case for a founder testing the app), **no one can restore the role**. It's a permanent lockout.

This matches the user's report exactly: "changed his status from admin to sales manager; after that, he couldn't go back."

## Fix scope (now)

Pure UI-level **prevention guardrail** — no DB migration, no RLS change, no RBAC refactor. The next-month role-based feature pass will handle proper transfer-of-ownership flows; this fix just stops new users from falling into the trap.

### Changes — `src/pages/Settings.tsx` only

1. **Lock the role dropdown when editing yourself.**
   In the edit dialog (lines ~610–622), detect `isSelf = editMember.userId === user?.id` (pull `user` from `useAuth()`, already imported elsewhere in the file or easily added).
   - When `isSelf` is true: render the role `Select` as **disabled** with the current role still visible, and show a small helper line beneath it: *"You can't change your own role. Ask another Super Admin to do it for you."*
   - When `isSelf` is false: behaves exactly as today.

2. **Defense-in-depth in `saveMember`** (lines ~242–266).
   Before calling the `user_roles` update, if `editMember.userId === user?.id && editMember.role !== originalRole`, short-circuit with `toast.error("You can't change your own role. Ask another Super Admin to do it for you.")` and return. This catches anyone who bypasses the disabled control (devtools, stale state).
   - To know `originalRole`, capture it when opening the edit dialog (stash on `editMember` as `originalRole`, or look it up from the `team` array by `editMember.id`).

3. **Also guard self-removal** (lines ~268–281, `confirmRemoveMember`).
   Same pattern: if `deleteMember.userId === user?.id`, block with a toast. Removing yourself has the same lockout shape and is worth fixing in the same pass.

4. **No changes** to:
   - The role dropdown options (still shows all three roles for *other* members).
   - RLS policies, DB functions, or migrations.
   - Any other page (`AuthContext`, `NewOrder`, `Schemes`, `OrderDetail` only *read* roles — unaffected).
   - The "Sole Super Admin" edge case (a workspace with one admin demoting *another* user is not the reported bug; addressing it requires DB-level "must keep ≥1 super_admin" checks, which belong in next month's RBAC pass).

## Out of scope (deferred to next month's role-based feature pass)

- Server-side trigger enforcing "every company must retain ≥1 super_admin" (proper fix for the sole-admin edge case).
- "Transfer ownership" flow (promote another member, then demote self atomically).
- Recovery RPC for already-locked-out users (one-off — the user asking is the only known case; can be unlocked manually via a migration if needed, ask before doing).
- Any change to the `app_role` enum or RLS policy structure.

## Result

- A Super Admin **cannot accidentally demote or remove themselves** from the Settings UI. The control is visibly disabled with a clear explanation, and the save handler refuses the operation as a backstop.
- All other team-management flows (editing other members, changing their roles, removing them) are unchanged.
- Zero risk to existing data, RLS, or permissions. Ships in one file.
