# Fix: page keeps "snapping back" / feels unstable

## What's actually happening

You're not being navigated to `/dashboard` by code — no page does that on its own except `/` (the landing page) when you're logged in. What you're seeing is a **loading flash** that looks like a refresh:

1. Every time the tab regains focus, `AuthContext`'s `visibilitychange` handler unconditionally calls `supabase.auth.getSession()`, then `setSession`, `setUser`, and `fetchProfile(user.id)` — even when the session hasn't changed.
2. Supabase also fires `onAuthStateChange` (`TOKEN_REFRESHED`) periodically. The current handler reacts by setting `profileLoaded = false` and re-running `fetchProfile`, again even when nothing changed.
3. `fetchProfile` always calls `setProfile(...)` with a new object reference. `AuthContext`'s value object is rebuilt every render (no `useMemo`), so every consumer (`AppLayout`, `DataProvider`, `NoCompanyGuard`, sidebar, topbar, all pages) re-renders.
4. While `profileLoaded` momentarily flips to `false`, downstream UI shows skeletons / spinners for ~200–800ms. The visual effect feels like "the page reset and went back to dashboard".

There is also an auto-recovery `setup_new_company` RPC that re-runs inside every `fetchProfile` if `company_id` is missing — extra network noise that compounds the flicker.

## Fix plan (frontend only, AuthContext)

**File: `src/context/AuthContext.tsx`**

1. **Make `setSession` / `setUser` idempotent.** Wrap the state setters so they only update when the session's `access_token` or user `id` actually changed. This stops `TOKEN_REFRESHED` and visibility re-checks from forcing every consumer to re-render.
2. **Stop resetting `profileLoaded` on token refresh.** In `onAuthStateChange`, only call `setProfileLoaded(false)` + `fetchProfile` when:
   - the event is `SIGNED_IN` AND the user id changed from the previous session, or
   - the event is `SIGNED_OUT`.
   Ignore `TOKEN_REFRESHED`, `USER_UPDATED`, `INITIAL_SESSION` for profile refetch purposes — they don't change who the user is.
3. **Throttle the `visibilitychange` re-check.** Only call `getSession()` if it's been more than ~60s since the last check, and only call `fetchProfile` if the returned user id differs from the one already in state. Never set `profileLoaded` to `false` here.
4. **Skip the `setProfile` write when the new row is equivalent.** Compare `id`, `company_id`, `full_name`, `email`, `phone`; if all match, keep the existing object reference. This avoids re-rendering every consumer on a no-op refresh.
5. **Gate the `setup_new_company` auto-recovery.** Only attempt the RPC once per session (track with a `useRef`), not on every visibility tick.
6. **Memoize the context value** with `useMemo` so consumers don't re-render just because `AuthProvider` re-rendered.

## Expected result

- Switching tabs / coming back from background no longer flashes skeletons or loaders.
- Token refresh (every ~50 min) becomes invisible to the UI.
- DataContext stops being nudged into recomputing memos when profile content is unchanged.
- No functional change to sign-in, sign-out, or workspace setup.

## Out of scope

- No router/redirect logic is being changed (none is misbehaving).
- No DataContext refactor — its effects already key on `companyId` (a stable string), so once `AuthContext` is calmed down, downstream churn disappears.
- Service worker / offline mode (still paused).

## Verification

- Open `/orders`, switch to another tab for 30s, come back → page should stay on `/orders` with no skeleton flash.
- Leave tab idle for 60+ min so the Supabase access token refreshes → no visible reload.
- Sign out / sign in → still works, lands on `/dashboard` once.
- `NoCompanyGuard` still triggers correctly for a fresh user with no company.
