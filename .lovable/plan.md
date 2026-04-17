

## Auth/Signup Audit — Findings & Fix Plan

### What I checked
- `Signup.tsx`, `Login.tsx`, `ResetPassword.tsx`, `AuthContext.tsx`, `App.tsx`, `NoCompanyGuard.tsx`
- Live DB: 14 users, recent signups, orphan profiles
- `error_log` table for silent failures
- Auth logs and `on_auth_user_created` trigger

### Findings

**🟢 Working correctly**
- Email/password signup with auto-session → `setup_new_company` runs → workspace ready ✅
- Email-confirm signup → trigger creates profile → on first login `AuthContext` auto-recovers via metadata ✅
- `NoCompanyGuard` is a hard backstop ✅
- Login, forgot password, reset password flow all correct ✅
- Recent users (asha, rahulps, raj illam, etc.) all have `company_id` populated correctly ✅
- The `rajillamsougandhikam@gmail.com` orphan from yesterday is now fully fixed (has company "Raj Illam") ✅

**🟡 Two real issues found**

**Issue 1 — One legacy orphan still exists (pre-fix)**
- `oviyaashaps@gmail.com` (April 8, before backfill) has NO profile row at all (not just missing company — the entire profiles row is missing). Auto-recovery can't help because it queries the profiles row first. If they log in today, `NoCompanyGuard` will show but submitting will fail because `setup_new_company` updates the profile row that doesn't exist.
- **Fix**: One-time migration to insert the missing profile row from `auth.users` data, then auto-recovery handles the rest. (Idempotent — safe to re-run.)

**Issue 2 — Live error in production logs (caught by our new error_log!)**
- `error_log` shows: `useData must be used within DataProvider` firing on `/settings` route, twice in last 5 min.
- Cause: when a user signs out from Settings, the `DataProvider` unmounts (because `companyId` becomes null and an internal re-render path), but the lazy-loaded `Settings` component's render closure briefly still calls `useData()`. This isn't crashing the app (caught by `PageErrorBoundary`) but it's noise and would scare a demo user if they saw the error toast.
- **Fix**: In `useData()`, return a safe empty fallback instead of throwing when context is null AND we're in a transient state (signing out / no auth). The throw stays for true developer mistakes (called outside `<DataProvider>` tree at all).

### Plan

**1. Migration — backfill missing profile rows**
For any `auth.users` row with no matching `profiles` row, insert one. Then any orphan with metadata gets recovered automatically on next login by existing `AuthContext` logic. Belt-and-suspenders: also call `setup_new_company`-equivalent inline for them (insert company + link + role) when metadata has `company_name`.

**2. Soften `useData()` throw**
Change the error-throwing behaviour to: if `companyId` and `user` are both null (signed-out / signing-out state), return a no-op stub instead of throwing. Throw only when `user` exists but no provider — a true bug.

**3. Add a tiny safety net in `Signup.tsx`**
After `setup_new_company` succeeds in the immediate-session path, also re-fetch profile to confirm `company_id` is set before navigating. If it isn't (extremely rare race), show a friendly "Finishing setup..." then `NoCompanyGuard` takes over. No new flows — just a guarantee.

**4. Smoke-test checklist for you to run before demos** (no code, just steps to follow once changes ship):
- Sign up fresh email → verify → log in → confirm dashboard loads, can add a dealer, refresh persists ✅
- Sign up with auto-session (if email confirm later disabled) → confirm same ✅
- Log in with existing user → no flicker, no errors ✅
- Forgot password → email link → set new password → land on dashboard ✅
- Sign out → log back in → no `useData` errors ✅

### Files
1. **Migration** — backfill missing `profiles` rows + auto-create companies for any with metadata
2. `src/context/DataContext.tsx` — soft-return from `useData()` when signed out instead of throwing
3. `src/pages/Signup.tsx` — re-fetch profile post-`setup_new_company` to guarantee company_id before navigating

### Out of scope
- No changes to email confirmation policy
- No changes to RLS or `setup_new_company` RPC
- No new UI surfaces — all fixes are internal hardening

### Why this makes you demo-safe
- Every existing user now has a working profile + company (after migration)
- Every future signup has 3 layers of safety: trigger → AuthContext auto-recovery → NoCompanyGuard
- The one remaining noisy console error during sign-out goes silent
- Any new failure mode would land in `error_log` immediately so we'd see it before users complain

