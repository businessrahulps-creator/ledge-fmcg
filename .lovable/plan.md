

# Clean Up Test Data

## Current State

| Table | Records | Content |
|-------|---------|---------|
| auth.users | 1 | `testuser-e2e@example.com` |
| companies | 1 | Test company |
| user_roles | 1 | Role for test user |
| profiles | 0 | (trigger-created, already gone) |
| Everything else | 0 | Already empty |

## Plan

Run a single database migration that deletes all data in the correct order (respecting dependencies), then deletes the test auth user:

1. **Delete in order**: `stock_deductions` → `order_lines` → `orders` → `stock_items` → `godowns` → `distributors` → `salespersons` → `products` → `user_roles` → `profiles` → `companies`
2. **Delete the test auth user** (`26677e5d-95ee-4ff1-b46f-d13e7707b098`) from `auth.users`
3. **Reset the order sequence** is handled automatically since the company row is deleted

After this, the database will be completely empty and ready for a fresh signup with your real account.

## What Stays the Same
- All database tables, functions, triggers, and RLS policies remain intact
- The app code is unchanged
- Signing up will create a new company and seed fresh demo data automatically (via the existing `setup_new_company` + `seed_company_data` flow)

