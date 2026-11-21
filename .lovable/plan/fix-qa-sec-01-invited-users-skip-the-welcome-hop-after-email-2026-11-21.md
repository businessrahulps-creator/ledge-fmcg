# Fix QA-SEC-01: invited users skip the /welcome hop after email confirmation

## What changes (one file: `src/pages/Auth.tsx`)
In the "already signed in" redirect effect, keep everything as is except the last line:

- Explicit `?redirect=` / saved post-auth redirect: unchanged, still wins first.
- Has a business (`companyId`): unchanged, go to `/dashboard`.
- No business: call the existing `fetchMyPendingInvite()` (imported from NoCompanyGuard, no change there), then
  - invite found -> `navigate("/invite/<token>", { replace: true })`
  - no invite (or the check fails) -> `navigate("/welcome", { replace: true })` as today.

## Race / loop safety
- A `useRef` flag marks that a redirect has been started, so repeated auth events or re-renders never navigate twice.
- The effect's cleanup sets a `cancelled` flag so a late invite answer after unmount/user change is ignored.
- Navigation happens only after the invite check resolves; the sign-in screen stays as it is meanwhile (no business form is shown on this page).
- `/welcome` and NoCompanyGuard keep their own invite checks as a safety net, so no loop is possible (they only send to `/invite/:token`, never back to `/auth`).

## Not touched
Database, RLS, roles, permissions, invite acceptance, Welcome, NoCompanyGuard, other auth logic. No publish.

## Verification
1. Add `src/pages/Auth.redirect.test.tsx` (mock auth + `fetchMyPendingInvite`): invite -> `/invite/tok`; no invite -> `/welcome`; has company -> `/dashboard` with no invite call; explicit redirect still wins; rerenders/repeated auth events navigate exactly once.
2. Live: create a fresh tagged test invite + new user, open `/auth?verified=1` signed in, record every URL visited with Playwright; confirm `/welcome` never appears and it lands on `/invite/:token`. Repeat with a user with no invite (lands on `/welcome`) and an existing member (lands on `/dashboard`), plus a page refresh.
3. Run the full automated suite; report results and remove the temporary test user/invite afterwards.
