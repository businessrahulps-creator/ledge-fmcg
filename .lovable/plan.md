

## Root cause (confirmed end-to-end)

A new user with email confirmation goes through this path and ends up in a **broken half-signed-up state**:

1. `Signup.tsx` calls `supabase.auth.signUp(...)`. Because email confirmation is on, Supabase returns `{ user, session: null }`.
2. The code hits `if (!authData.session)` → toasts "Check your email" → navigates to `/login`. **`setup_new_company` RPC is never called.**
3. Meanwhile, the `on_auth_user_created` DB trigger inserts a row in `profiles` with `company_id = NULL`.
4. User clicks the email link, lands on the app, logs in. `AuthContext` loads the profile fine but `companyId = null`.
5. `DataContext` sees `authReady && !companyId` → wipes all state arrays and stops fetching. Settings / Dealers / Orders pages render empty.
6. User tries to add a dealer / salesperson / order. `makeOfflineCrud.add` runs `if (!companyId) return;` — **silent no-op, no toast, no error**. UI may briefly show optimistic state in some flows but on refresh everything is gone.
7. User opens Company page and fills the form. `saveCompany()` does `if (companyId) { ...update companies... }` — **silently skipped**. Only the local in-memory `updateCompanyInfo` runs, so it *looks* saved until refresh.
8. Same user (`rajillamsougandhikam@gmail.com`) is sitting in the DB right now with `company_id = NULL` confirming this exactly.

There's no recovery path anywhere in the app for "logged in but no company" — no onboarding screen, no fallback, no error.

## Permanent fix

A four-part fix that closes the gap forever, no matter how the user got into this state.

### 1. Auto-recover on every app load (the safety net)
**`src/context/AuthContext.tsx`** — after `fetchProfile` loads the profile, if `profile.company_id IS NULL` AND `auth.users.raw_user_meta_data` has `company_name`, call `setup_new_company` automatically with the metadata captured at signup. Then re-fetch the profile.

This single change retroactively rescues the existing orphan user the moment they next open the app, and prevents the bug for any future user who ends up half-signed-up.

### 2. Fix the signup flow so company creation isn't lost on email-confirm
**`src/pages/Signup.tsx`** — keep the existing "session immediately" path for backward compatibility, but when `!authData.session` (email confirmation case), the `full_name` and `company_name` are already passed to `signUp` via `options.data`, so the trigger and step (1) above will set things up correctly when the user verifies and logs in. Update the toast copy to say: *"Check your email to verify, then sign in — your workspace will be ready."*

### 3. Add a hard "no company" guard so silent failures become loud
**New component `src/components/onboarding/NoCompanyGuard.tsx`** rendered inside `AppLayout` (or wrapping `ProtectedRoute`). When `authReady && user && !companyId`:
- Show a full-screen recovery modal: "Finish setting up your workspace" with `Company name` + `Your name` inputs (prefilled from `auth.user_metadata`).
- Submitting calls `setup_new_company` then `refreshProfile` then reloads dashboard.
- This guarantees the user can never see empty pages and silent-failing buttons again.

### 4. Make CRUD failures impossible to miss
**`src/context/data-utils.ts` `makeOfflineCrud.add/update/remove`** — replace the silent `if (!companyId) return;` with:
```ts
if (!companyId) {
  toast.error("Workspace not set up", { description: "Please complete workspace setup first." });
  return;
}
```
**`src/pages/Company.tsx` `saveCompany`** — same: if `!companyId`, show an error toast and bail instead of pretending it saved.

### 5. Backfill the existing affected user (one-time migration)
A migration runs once to fix `rajillamsougandhikam@gmail.com` (and any future duplicates):
```sql
-- For each profile with NULL company_id, create a company from auth metadata
DO $$
DECLARE r RECORD; new_company_id uuid;
BEGIN
  FOR r IN
    SELECT p.user_id, p.full_name,
           COALESCE(u.raw_user_meta_data->>'company_name', 'My Workspace') AS company_name,
           COALESCE(NULLIF(p.full_name,''), u.raw_user_meta_data->>'full_name', '') AS final_name
    FROM profiles p JOIN auth.users u ON u.id = p.user_id
    WHERE p.company_id IS NULL
  LOOP
    INSERT INTO companies (name, trial_ends_at) VALUES (r.company_name, now() + interval '30 days')
    RETURNING id INTO new_company_id;
    UPDATE profiles SET company_id = new_company_id, full_name = r.final_name WHERE user_id = r.user_id;
    INSERT INTO user_roles (user_id, role) VALUES (r.user_id, 'super_admin') ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
```

## Files changed
1. **Migration** — backfill orphan profiles + (optional) make `setup_new_company` safe to call repeatedly (already idempotent — verified).
2. `src/context/AuthContext.tsx` — auto-recover on profile load when `company_id IS NULL`.
3. `src/pages/Signup.tsx` — clearer copy in the email-verify branch.
4. `src/components/onboarding/NoCompanyGuard.tsx` — **new** full-screen recovery modal.
5. `src/App.tsx` — mount `NoCompanyGuard` inside `ProtectedRoute`.
6. `src/context/data-utils.ts` — toast errors in `add`/`update`/`remove` when `companyId` is missing instead of silent return.
7. `src/pages/Company.tsx` — toast error in `saveCompany` when `companyId` is missing.

## Out of scope
- No changes to email-confirmation policy itself (don't disable it).
- No changes to RLS policies — they're correct; the bug is purely the missing company link.
- No changes to existing `setup_new_company` RPC (already idempotent — handles re-calls safely).
- No changes to other domain CRUD logic, realtime, or sync queue.

## Why this is permanent
- **Defence in depth:** trigger creates profile → AuthContext auto-recovers if no company → guard modal forces setup if auto-recover fails → all CRUD now reports errors loudly. There is no remaining path to silent data loss.
- **Backfill** rescues the user already affected today.
- **Idempotent recovery** (`setup_new_company` already checks for existing company) means repeated calls are safe.

