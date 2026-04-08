

# Phase 1 E2E Testing Plan

## Step 1: Clean Up Orphaned Data

Delete the orphaned "MP AGENCIES" company and the stale `user_roles` entry for the orphaned user `oviyaashaps@gmail.com` (user_id `f75a594f-ea28-43ca-ab35-b7666b11377b`). The auth user itself can remain — it has no profile or company link so it's harmless.

Using the insert tool (data operations):
```sql
DELETE FROM user_roles WHERE user_id = 'f75a594f-ea28-43ca-ab35-b7666b11377b';
DELETE FROM companies WHERE id = '7b957ec3-2c5a-4e47-9cb6-cc1f56e89846';
```

## Step 2: Browser E2E Isolation Tests

Sequential browser-based testing for all 5 accounts. Each test logs in, verifies data counts, performs a mutation, logs out, and cross-checks isolation.

### Test Suite A: Account 1 (test1@getledge.in / TestCo Kerala)
1. Navigate to `/login`, sign in
2. Verify dashboard loads — check distributor count (7), product count (8), order count (8)
3. Navigate to Distributors → create "E2E Test Dealer Kerala"
4. Navigate to New Order → create a test order
5. Sign out

### Test Suite B: Account 2 (test2@getledge.in / TestCo Bangalore)
1. Login → verify dashboard shows TestCo Bangalore data (7 dist, 8 prod, 8 orders)
2. Navigate to Distributors → confirm "E2E Test Dealer Kerala" is NOT visible (isolation check)
3. Navigate to Orders → confirm the Kerala test order is NOT visible
4. Sign out

### Test Suite C-E: Accounts 3-5
1. Login each account → verify own data loads
2. Confirm no Kerala test data leaks
3. Sign out

### Test Suite F: Reports Isolation
1. Login as test1 → Reports page → verify data matches own company
2. Login as test2 → Reports page → verify different data, no Kerala bleed

## Step 3: Fresh Signup Flow

1. Navigate to `/signup`
2. Sign up as `test6@getledge.in` with password `TestLedge@2026!`, company "TestCo Pune"
3. Verify auto-redirect to dashboard
4. Check that profile was created, company was created, seed data was seeded (7 distributors, 8 products, etc.)
5. Verify isolation from all other accounts

## Step 4: Output Report

A structured PASS/FAIL table covering:

| Account | Login | Dashboard Data | Create Dist | Create Order | Isolation | Reports | Result |
|---------|-------|----------------|-------------|--------------|-----------|---------|--------|

Plus explicit data leakage assertions and any warnings.

## Technical Notes

- The trigger `on_auth_user_created` is confirmed active on `auth.users`
- `setup_new_company` now calls `seed_company_data` internally
- RLS policies use `get_company_id()` (SECURITY DEFINER) which queries profiles
- App code double-scopes with `.eq("company_id", companyId)` — belt and suspenders
- Email confirmation may block the test6 signup — if so, we'll note it and test via edge function instead

## Files Changed
- No code changes — this is a testing + cleanup task
- Database: 2 DELETE statements for orphaned data

