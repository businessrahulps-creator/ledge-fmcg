

## Bug: Flash of "Finish setting up your workspace" modal on every login

### Root cause

In `AuthContext.tsx`, `authReady` is set to `true` immediately when the auth session resolves, but the `profile` fetch is scheduled via `setTimeout(..., 0)` (correctly, to avoid Supabase deadlock). This means there is a render window where:

- `authReady === true`
- `user !== null`
- `profile === null` → `companyId === null`

`NoCompanyGuard` checks only `!authReady || !user || companyId`, so during that window it renders the workspace setup modal — the "flash" the customer reported. Once the profile resolves (typically <300ms on desktop, but easily 500–1500ms on mobile), it disappears.

This affects **both desktop and mobile**, just more visible on mobile due to slower networks/CPUs.

### Fix (one-file, surgical)

Add a `profileLoaded` boolean to `AuthContext` that flips true only after the profile fetch attempt completes (success or empty). Then change `NoCompanyGuard` to also wait for `profileLoaded` before deciding to show the modal.

Files:

1. **`src/context/AuthContext.tsx`**
   - Add `profileLoaded: boolean` state, default `false`.
   - In `fetchProfile`, always set `profileLoaded = true` in a `finally` block (covers success, missing row, error, and the auto-recovery path).
   - When `onAuthStateChange` fires with no user, set `profileLoaded = true` (nothing to load).
   - Reset `profileLoaded = false` whenever a new `user.id` starts loading.
   - Expose `profileLoaded` via context type + provider value.

2. **`src/components/onboarding/NoCompanyGuard.tsx`**
   - Pull `profileLoaded` from `useAuth()`.
   - Change the early-return guard from
     `if (!authReady || !user || companyId) return children;`
     to
     `if (!authReady || !profileLoaded || !user || companyId) return children;`
   - Result: while the profile is still loading post-auth, we render children (the page/skeleton) instead of flashing the setup modal. Real users with a company never see the modal; users genuinely missing a company still see it once the fetch confirms `company_id === null`.

3. **`src/pages/Index.tsx`** (defensive, tiny)
   - Already gated on `loading || !authReady` showing `SplashScreen`. No change needed — the redirect to `/dashboard` is fine because `ProtectedRoute` will then run the corrected guard.

### Why this fully fixes it

- The setup modal now only appears when we've **confirmed** the profile has no `company_id`, not during the unknown-state window.
- No regression for legitimate first-time signups: `setup_new_company` runs in `Signup.tsx` before navigating, and the auto-recovery path in `fetchProfile` still runs and updates `profile` before `profileLoaded` flips true (it's in the same async function; the `finally` only fires after recovery completes).
- No regression for returning users: once the profile loads with a `company_id`, the guard short-circuits as before.
- Works identically on desktop and mobile — fixes both.

### Out of scope

No DB changes. No new features. No styling changes. No changes to `Signup.tsx` flow, RPC, or RLS.

