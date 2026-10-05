# Stop getledge.in from jumping straight to "Set up your business"

## Why it happens
Right now the landing page sends anyone who is already signed in straight into the app. Your phone is still signed in to an account that hasn't set up a business yet (probably a Google account you used once to try signing in). The app sees that, skips the landing page and opens the first setup step ("What's the name on the cover?"). Visitors who aren't signed in still see the landing page as normal.

## What changes
1. **The landing page always shows first.** Opening getledge.in never sends you anywhere on its own, whether you're signed in or not.
2. **Signed-in visitors get a clear way in.** Where the top menu normally shows sign-in, signed-in people see:
   - "Open Ledge" if their account already has a business
   - "Finish setup" if it doesn't
3. **A way out of setup.** The setup screen gets a small "Not you? Sign out" link showing which email is signed in, so anyone stuck on the wrong account can switch.
4. The sign-in page and links into the app (like the dashboard) still work as they do now.

## Checks
- Signed out: the landing page shows.
- Signed in with a business: the landing page shows with "Open Ledge", which opens the dashboard.
- Signed in without a business: the landing page shows with "Finish setup". Setup shows the email and signs out properly.
- Check on a phone and a computer. All automated checks pass.

## Technical details
- `src/pages/Index.tsx`: remove the `<Navigate to="/dashboard">` redirect.
- `Navbar.tsx`: use `useAuth()`. Show "Open Ledge" (goes to `/dashboard`) when `companyId` is set, or "Finish setup" (goes to `/welcome`) when it isn't. Keep the menu's layout and colours, and only swap the button text and link.
- `Welcome.tsx`: show the signed-in email and a sign-out link (`supabase.auth.signOut()`, then go to `/`).
- Leave `NoCompanyGuard` as it is.
- Record a rule in `AGENTS.md`: the landing page never redirects automatically.
