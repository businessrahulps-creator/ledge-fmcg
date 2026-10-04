# Bot pictures for every job

Every person in Ledge gets a bot as their picture, matched to their job:

| Job | Bot |
|---|---|
| Owner | Square (unchanged) |
| Sales manager | Circle |
| Accountant | Triangle |
| Sales rep | Drop |
| Viewer | Sleeping bot (calm, eyes shut) |

Where it shows: next to the bell (computer), inside the account menu, the phone Menu, and the Team list and access drawer, so you can see someone's job at a glance.

## UI/UX rules
- All bots stay calm: no jumping, small head turn, no reaction to the mouse, and fully still for people who turn off motion on their device.
- While a bot is loading, the current coloured letter shows in the same spot, so nothing jumps.
- The job name still appears in text (e.g. "Your access: Accountant") — the bot never replaces the words.
- The small job icon badge stays on the letter fallback only.

## Technical details
- Rename `OwnerBot.tsx` to `RoleBot.tsx` taking `type` and `sleeping` props; map in `RoleAvatar.tsx`: super_admin→square, sales_manager→circle, accountant→triangle, salesperson→drop, viewer→`state="sleeping"` (circle-style pebble shape). Unknown roles fall back to the letter.
- Keep it lazy-loaded (one shared chunk); `jumpEvery={0} turn={0.5} interactive={false}`, `paused` when `prefers-reduced-motion`; give each a `seed` from the name so Team rows don't blink in unison.
- Use `RoleAvatar` in TeamRoster/OverrideDrawer rows if they render their own initials.
- Update the AGENTS.md role-picture rule (every role = its own bot).
- Verify in the browser: menu, Team list, phone Menu.
