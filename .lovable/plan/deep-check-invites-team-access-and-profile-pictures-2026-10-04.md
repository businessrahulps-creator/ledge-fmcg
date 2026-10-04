# Deep check: invites, team access and profile pictures

What gets checked: everything shipped in the last hour or so.
- Invite someone (both steps, extra access, sending, accepting)
- Team list, "Change access" panel, Reset, Custom access tag
- Profile menu next to the bell, Settings / Sign out, role bots everywhere
- Business settings access (Company page) for non-owners

## How
1. **Astra (top reasoning setting)** reads all the changed screens and the database rules, then lists real problems with steps to reproduce.
2. **Fable 5.1 (latest available)** takes a fresh, separate approach and does the same on its own, without seeing Astra's list.
3. I confirm each reported problem against the live app before fixing anything. Guesses that turn out wrong are thrown away, not fixed.
4. **Live tests I run myself:**
   - Server rules: you can't change your own access, can't change the owner's access, can't give owner-only access, people from another business can't be touched, invite with extra access saves only the real differences, accepting an invite applies them, Reset removes them.
   - A real end-to-end invite: I invite a test person and accept it as them. Then I check their bot, their menu, which pages they can open, and that the Company page opens only when Business settings was given. I check each job (manager, accountant, sales rep, viewer). All test people and invites are removed afterwards.
   - Screens on computer and phone size: the invite sheet, the access panel, the profile menu, Sign out, the phone Menu, and motion-off mode. I check for layout breaks, text overflow, keyboard use and screen-reader labels.
   - All existing automatic checks (390) still pass.
5. Fix every confirmed problem, then **Fable re-checks the fixes** in one final pass.
6. Report back in plain words: what was found, what was fixed, and anything left open with the reason.

## Technical details
- Astra: `openai/gpt-6-astra` on `/v1/responses`, reasoning `max`, streamed, no max_tokens. Fable: `anthropic/claude-fable-5-1` on `/v1/messages`, streamed. Both get the full source of the changed files (InviteSheet, AccessAreaList, CapabilityToggleRow, OverrideDrawer, useOverrideEditor, TeamRoster, accessCopy, RoleAvatar, RoleBot, ProfileMenu, AppLayout, nav-config, Company gate) plus the SQL for send_team_invite, accept_team_invite, set_member_access_atomic, _access_clean, _access_toggleable, the companies policy and my_capabilities. Scripts live in /tmp only; nothing AI-related is added to the app.
- Test people are created with `lovable auth-session` or the signup flow and removed through the normal remove-member path. Every change stays recorded in Activity.
- Any database fix ships as a new migration; AGENTS.md is updated if a rule changes.
