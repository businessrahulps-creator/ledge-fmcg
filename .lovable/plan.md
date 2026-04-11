

# Team Management Persistence in Settings

## Overview
Replace hardcoded team member list with real data from `profiles` + `user_roles` tables, with full CRUD persisted to the database.

## Approach
All changes stay within `src/pages/Settings.tsx` — no DataContext changes needed. The team tab will directly query Supabase for profiles joined with user_roles filtered by the current company_id.

## Changes

### 1. Settings.tsx — Team data loading
- Replace the hardcoded `useState<TeamMember[]>([...])` with an empty array + a `loadTeam()` function that queries:
  ```sql
  SELECT p.id, p.full_name, p.email, p.phone, ur.role, ur.id as role_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE p.company_id = companyId
  ```
- Call `loadTeam()` on mount and after every CRUD operation.
- Update `TeamMember` interface to include `phone`, `userId`, and `roleId`.

### 2. Settings.tsx — Add member (dialog + save)
- Add a `phone` field to the add/edit dialog.
- On "Add Member": insert into `profiles` (full_name, email, phone, company_id, user_id = gen_random_uuid()) and then insert into `user_roles` (user_id, role).
- Note: since we're not doing full auth invitation, we create a profile row with a generated user_id. This is a placeholder approach per spec.

**Wait** — `profiles.user_id` references `auth.users(id)`. We can't insert arbitrary UUIDs. Let me re-check.

Actually, looking at the schema, `profiles.user_id` has no FK constraint listed in the schema dump. And `user_roles.user_id` also has no FK listed. So we can insert placeholder UUIDs. But `on_auth_user_created` trigger creates profiles automatically. For team management without auth invitation, we'll create profile + role rows with a generated UUID as `user_id`.

### 3. Settings.tsx — Edit member
- Update `profiles` row (full_name, phone) and `user_roles` row (role) using the stored IDs.
- Email is read-only on edit (since it's tied to identity).

### 4. Settings.tsx — Delete member  
- Delete from `user_roles` where `id = roleId`, then delete from `profiles` where `id = profileId`.
- Cannot delete yourself (super_admin protection already in UI).

### 5. No database migration needed
- All tables and RLS policies already exist and support the required operations.

## Files changed
| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Replace hardcoded team with Supabase queries, add phone field to dialog, wire CRUD to DB |

## What stays untouched
- Company tab, Subscription tab — no changes
- DataContext — no changes needed
- All other pages and components
- Existing RLS policies (profiles and user_roles already have correct policies)

