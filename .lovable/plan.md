

# Bug #10: Real 30-Day Free Trial

## Overview
Replace the hardcoded `trialDaysLeft = 11` stub with a real `trial_ends_at` column on `companies`, set automatically on signup.

## 1. Database Migration
- Add `trial_ends_at timestamptz` column to `companies` (nullable, default `now() + interval '30 days'`)
- Backfill existing rows: `UPDATE companies SET trial_ends_at = now() + interval '30 days' WHERE trial_ends_at IS NULL`
- Update `setup_new_company` function to set `trial_ends_at = now() + interval '30 days'` in the company INSERT

## 2. Settings.tsx Changes
- In the company fetch (line 79), add `trial_ends_at` to the select
- Store `trialEndsAt` in state (replace hardcoded `trialDaysLeft = 11`)
- Calculate `remainingDays = Math.max(0, Math.ceil((trialEndsAt - now) / 86400000))`
- Progress bar: `(remainingDays / 30) * 100`, color: green >7, yellow 3–7, red <3
- Display formatted trial end date and exact days left
- If expired (0 days): show "Trial Expired" state with CTA
- "Upgrade Plan" button: show toast "Billing integration coming soon — contact support"
- Subscribe to realtime changes on `companies` table for the company row to update trial status across tabs

## 3. Enable Realtime
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.companies`

## Files Changed
| File | Change |
|------|--------|
| Migration SQL | Add column, backfill, update RPC, enable realtime |
| `src/pages/Settings.tsx` | Fetch & display real trial data, realtime subscription |

