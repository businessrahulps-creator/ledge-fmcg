# Fix: invited people land on "Set up your business" instead of joining the team

## What's going wrong
The invite is only accepted if the person lands back on the invite page after signing up. Several sign-up paths lose that:
- **Email sign-up:** after creating the account, Ledge always sends the person to business setup and ignores the invite they came from.
- **Email confirmation link:** the "confirm your email" link opens a fresh tab, which has forgotten the invite, so the person goes to setup.
- **Already had an account:** someone who signed in once before (with no business) goes straight to setup.

This matches the latest invite in your data: ttj7751@gmail.com is still "pending". The account was made an hour before the invite and has no business, so the person was shown setup instead of joining.

## What changes
1. **Ledge checks for a waiting invite before showing setup.** Whenever a signed-in person has no business, Ledge first asks the server: "Is there a pending, unexpired invite for this email?" If yes, it opens that invite and they join the team automatically. Setup only shows when there's no invite.
2. **Email sign-up keeps the invite.** After sign-up, the person goes back to the invite page instead of setup.
3. **The email confirmation link carries the invite,** so it works even when opened in a new tab or on another device.
4. **Copy on the invite page** says "Create your account to join [Company]" so it's clear they're joining, not starting a business.

ttj7751@gmail.com only needs to open Ledge again after this ships, and they'll join your team automatically.

## Checks
- New person, email sign-up from the invite link, then confirming in a new tab: they join the team and land on the Dashboard. They never see setup.
- New person signing up with Google from the invite: they join the team.
- Existing account with no business opens Ledge: they're moved to the invite and join.
- A person with no invite still sees setup as normal. An expired or wrong-email invite is not used.
- All automatic checks pass. Test accounts and invites are removed afterwards.

## Technical details
- New SECURITY DEFINER RPC `my_pending_invite()`: returns the token of the newest `team_invites` row where `status='pending'`, `expires_at > now()`, and `lower(email) = lower(auth.email())`, only when the caller has no `profiles.company_id`. Execute is granted to authenticated users only; anon is revoked. No new table access.
- `NoCompanyGuard` and `Welcome.tsx`: before step 0, call the RPC. If it returns a token, `navigate('/invite/'+token, { replace: true })`. `Invite.tsx` already auto-accepts through `accept_team_invite`.
- `Auth.tsx onSignUp`: honour the `redirect` param or `ledge:postAuthRedirect` (same safe same-origin check as the signed-in branch) instead of a hard `/welcome`. Set `emailRedirectTo` to `/auth?verified=1&redirect=<invite path>` when a redirect exists.
- Record a rule in `AGENTS.md`: business setup is never shown while a matching pending invite exists.
