# Admin sign-in page for your team

A dedicated login page at **/ops/login** where you and your team sign in with a username and password, landing straight in Ledge Ops. Nothing about the customer app changes.

## How the login works

- Go to `getledge.in/ops` → if not signed in as staff, you get the Ledge Ops sign-in card (plain, dark, labelled internal — no Ledge marketing, no Google button, no "create account", no password reset).
- Username **admin**, password **getledge200**.
- "admin" is not a second, hand-rolled password check living in the app's code. It is a real account in the same login system that protects everything else, so the password is stored hashed, never sits in the code or the browser bundle, and can be changed or switched off without a release. The login page simply turns the username **admin** into that account behind the scenes.
- Once signed in, the team member sees the five Ops screens exactly as they are today. Anyone signed in as a customer who wanders to /ops still gets a 404 — the tool never advertises itself.
- Your own account (business.rahulps@gmail.com) keeps working as it does now, so you can reach /ops from your normal login too.

## What this costs you, plainly

One shared login means the activity trail says "admin" for every action, so you cannot tell who on the team looked at which customer, and when someone leaves the team the password has to change for everybody. That is fine for a read-only panel that only shows numbers, which is what this is. Before the panel can change or delete anything, each team member should get their own named login — the groundwork already supports that (adding a person is one row, no code change).

## Scope

In:
- `/ops/login` page.
- The shared `admin` account, added to the staff list at viewer level.
- Sending a signed-out visitor from any /ops page to /ops/login instead of the login screen for customers.
- A sign-out button in the Ops header (today it only says "Back to app", which is wrong for a team member with no Ledge business of their own).
- Keeping the shared account out of the "Registered users" count and the People list, so your platform numbers stay honest.

Out (revisit later, as you said):
- Per-person team logins and an invite flow.
- Two-factor or an extra passphrase.
- Any ability to change customer data from the panel — still read-only.

## Technical notes

- **Account**: `admin@ops.getledge.in`, password `getledge200`, created once through the normal sign-up API with email confirmation temporarily auto-confirmed and turned straight back off, so no customer sign-up behaviour changes. Inserted into `platform_staff` with `level = 'viewer'`.
- **`src/pages/ops/OpsLogin.tsx`** (new): username + password form; maps `admin` → the account's email (`${normalised}@ops.getledge.in`), calls `signInWithPassword`, redirects to the route the visitor asked for, or `/ops`. Generic "That username or password is not right" on failure — no hints about which part was wrong, no account existence leak. Rate-limited by the auth service already.
- **`RequireStaff`**: signed-out → `<Navigate to="/ops/login" state={{ from }} />` instead of `/login`. Signed-in-but-not-staff → unchanged `/404`.
- **`App.tsx`**: add the public `/ops/login` route (outside `ProtectedRoute`, no `RequireStaff`).
- **`OpsLayout`**: header gains a "Sign out" button (`supabase.auth.signOut()` → `/ops/login`); "Back to app" only renders when the signed-in user has a company.
- **Ops RPCs**: `ops_list_users` and the `users` / `new_users` counts in `ops_platform_summary` exclude anyone in `platform_staff`. One migration, no other behaviour touched.
- The `profiles` row the sign-up trigger creates for the shared account has no company; Ops routes never pass through `NoCompanyGuard`, so it is inert.
- Verification: sign in at /ops/login as admin at 393px and on desktop, walk all five screens, confirm audit rows record the action; confirm a wrong password is refused; confirm a customer account signed in at /ops still gets 404 and the Ops RPCs still refuse it; typecheck, full test run, build.
