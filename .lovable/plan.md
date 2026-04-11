

# Fix Bug #17: Consolidate Duplicated SELECT Policies on Profiles

## Problem
The `profiles` table has two redundant SELECT policies that can be merged into one cleaner policy using an OR condition.

## Fix
Single database migration:

1. Drop `"Users can view their own profile"` (SELECT, `user_id = auth.uid()`)
2. Drop `"Users can view own-company profiles"` (SELECT, `company_id = get_company_id()`)
3. Create `"Users can view relevant profiles"` (SELECT, `user_id = auth.uid() OR company_id = get_company_id()`)

## Scope
- One migration file, no frontend code changes
- INSERT/UPDATE/DELETE policies untouched
- All roles (super_admin, sales_manager, accountant) unaffected

