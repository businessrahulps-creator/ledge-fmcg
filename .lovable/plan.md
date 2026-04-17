

## Phase 1 — Auth Audit: Confirmed Decisions

User confirmed:
- Trial = **30 days** (current code is correct, no change)
- New signups stay **empty** (no `seed_company_data` call — current behavior is correct)

### Now I'll do (default mode, read-only DB queries + targeted code fixes only):

1. **DB sanity queries** (4 reads):
   - Orphan profiles (no `company_id`) older than 1h
   - Users without a `user_roles` row
   - Recent signups (last 7 days) health check
   - `error_log` entries from `auth:*` sources, last 7 days

2. **Verify `on_auth_user_created` trigger is actually attached** to `auth.users`. The `<db-triggers>` block says "no triggers" — if the function exists but isn't wired, every new signup silently skips profile creation and relies on `setup_new_company` to create the profile. Need to confirm via `pg_trigger` query. If missing → migration to recreate the trigger.

3. **Code fixes (only if confirmed needed)**:
   - `Signup.tsx`: add `emailRedirectTo: ${window.location.origin}/login` to `supabase.auth.signUp()` so the email-confirmation link lands on the right URL (currently unset → defaults to Supabase's site URL which may be wrong on custom domain `getledge.in`).
   - No other auth code changes planned.

4. **Skipped (out of scope for Phase 1)**:
   - GSTIN/phone validation — not collected at signup, will check on Settings/Dealer forms in Phase 2.
   - Trial banner UI — Phase 2.
   - RLS — Phase 4.

### Deliverable
Reply with `PHASE 1 COMPLETE` listing: queries run, trigger status, fixes applied, files changed. Then await your go-ahead for Phase 2.

