

# Notification Persistence to Database

## Overview
Replace in-memory notification context with a Supabase-backed `notifications` table, including realtime subscription for cross-tab/device sync.

## 1. Database migration — Create `notifications` table

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users see notifications for their company
CREATE POLICY "Users can view company notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (company_id = get_company_id());

-- Authenticated users can insert notifications for their company
CREATE POLICY "Users can insert company notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id());

-- Users can update (mark read) their company notifications
CREATE POLICY "Users can update company notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (company_id = get_company_id())
  WITH CHECK (company_id = get_company_id());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

## 2. Update `src/hooks/use-notifications.tsx`

- Remove seed data and in-memory state.
- Import `supabase` client and `useAuth` for `companyId`.
- On mount: fetch notifications from DB ordered by `created_at DESC`.
- `addNotification`: insert row into `notifications` table with company_id from auth context.
- `markAsRead`: update `read = true` where `id = notifId`.
- `markAllAsRead`: update `read = true` where `company_id = companyId AND read = false`.
- Subscribe to realtime `postgres_changes` on `notifications` table — on INSERT, prepend to local state; on UPDATE, update local state.
- Cleanup subscription on unmount.
- Map DB column `message` → UI field `description`, `created_at` → `timestamp`.

## 3. Update callers (no API changes needed)

The `addNotification(type, title, description)` signature stays identical. Callers in `NewOrder.tsx` and `Settings.tsx` remain unchanged. The function now inserts into DB instead of pushing to local state (realtime subscription handles UI update).

## 4. `NotificationCenter.tsx` — No changes needed

The component already reads from `useNotifications()` hook which will now return DB-backed data with the same interface.

## Files changed
| File | Change |
|------|--------|
| Migration SQL | Create `notifications` table + RLS + realtime |
| `src/hooks/use-notifications.tsx` | Replace in-memory with Supabase queries + realtime |

## What stays untouched
- `NotificationCenter.tsx` — identical UI, animations, badges
- `NewOrder.tsx`, `Settings.tsx` — same `addNotification` calls
- All other pages, components, DataContext

