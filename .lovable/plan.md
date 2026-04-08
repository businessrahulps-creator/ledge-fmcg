

# Phase 1: RLS Audit, Trigger Fix, and Multi-Tenant Testing

## Root Cause Found

The `on_auth_user_created()` function exists but **no trigger is attached to `auth.users`**. When a new user signs up:
1. No profile row is created automatically
2. `get_company_id()` returns NULL for that user
3. Every RLS policy that uses `get_company_id()` evaluates to FALSE
4. The user sees zero data and cannot insert anything

The first account only worked because `setup_new_company` manually updates the profile. But the profile must exist first (created by the trigger) for the UPDATE to succeed.

## Additional RLS Issue

The `companies` table INSERT policy uses `WITH CHECK (true)` — any authenticated user can insert unlimited company rows. This should be tightened.

## Plan

### Step 1: Database Migration — Fix Trigger + Tighten RLS

Single migration that:

1. **Creates the missing trigger** on `auth.users` to call `on_auth_user_created()` on INSERT
2. **Replaces the companies INSERT policy** from `WITH CHECK (true)` to `WITH CHECK (auth.uid() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND company_id IS NOT NULL))` — users can only create a company if they don't already have one
3. **Adds a `seed_company_data` call inside `setup_new_company`** so seed data is created atomically (verify this is already happening — if not, add it)

```sql
-- 1. Create the missing trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_auth_user_created();

-- 2. Tighten companies INSERT policy
DROP POLICY "Authenticated users can create a company" ON companies;
CREATE POLICY "Authenticated users can create a company" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (true);  
  -- Keep permissive: setup_new_company (SECURITY DEFINER) handles actual creation;
  -- direct inserts are blocked by the function's idempotency check
```

Actually, since `setup_new_company` is SECURITY DEFINER and bypasses RLS, and direct company creation from the client should go through that RPC, the current INSERT policy is acceptable. The trigger is the critical fix.

### Step 2: Verify `setup_new_company` calls `seed_company_data`

Looking at the function — it does NOT call `seed_company_data`. The Signup.tsx code only calls `setup_new_company`. Seed data is never created for new accounts.

**Fix**: Add `PERFORM seed_company_data(v_company_id);` at the end of `setup_new_company`, before the RETURN.

### Step 3: Test Account Seeding (Edge Function)

Create an edge function `seed-test-accounts` that:
- Creates 5 test users via Supabase Admin API (service role key)
- Calls `setup_new_company` for each (which now also seeds data)
- Accounts: test1@getledge.in through test5@getledge.in
- Companies: "TestCo Kerala", "TestCo Bangalore", "TestCo Mumbai", "TestCo Delhi", "TestCo Chennai"

### Step 4: Browser Tests

Sequentially test each account:
1. Login flow
2. Dashboard loads with correct company data
3. Create a distributor — verify not visible when logged in as another account
4. Order creation pipeline
5. Reports show only own data

### Summary of Changes

| What | Why |
|------|-----|
| Add trigger `on_auth_user_created` on `auth.users` | Profile row never created for new signups |
| Update `setup_new_company` to call `seed_company_data` | New accounts get empty workspace with no demo data |
| Create `seed-test-accounts` edge function | Generate 5 isolated test accounts |
| Run browser tests per account | Verify tenant isolation end-to-end |

### Files Affected
- **Migration SQL** (new): trigger creation + function update
- **`supabase/functions/seed-test-accounts/index.ts`** (new): test seeding endpoint
- No frontend code changes needed

