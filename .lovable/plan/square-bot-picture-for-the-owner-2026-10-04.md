# Square bot picture for the owner

## What you'll see
- **Owner (Super Admin):** the square bot from Bot Avatars replaces the dark circle with the crown. It shows in three places:
  - next to the bell on a computer
  - inside the account menu
  - at the top of the phone Menu
- **Everyone else** (sales manager, accountant, salesperson, viewer) keeps their coloured circle with their first initial and small icon, exactly as now.
- The bot stays calm in the top bar. It looks around but doesn't keep jumping, so it won't pull attention while people work. Clicking it still opens the account menu as before.
- People who have turned on "reduce motion" on their device see a still bot.
- The access label ("Owner (Super Admin)") and the menu items stay the same.

## Checks
- On a computer, the bot shows next to the bell and inside the menu, and Settings and Sign out still work.
- On a phone, the bot shows in the Menu sheet.
- A non-owner role still shows the coloured circle (checked by reading the code, since there's no second test account).
- The page still opens quickly and all automatic checks pass.

## Technical details
- Install `bot-avatars` (React 18, no other dependencies).
- `RoleAvatar.tsx`: when `role === "super_admin"`, render `<BotAvatar type="square" size={32|44} jumpEvery={0} turn={0.5} interactive={false} />` in place of the initial and badge, wrapped in a span with `aria-hidden` (the trigger already has an aria-label). All other roles keep the existing code path.
- Load the bot lazily (`React.lazy`), with the existing initial circle shown as the fallback, so the extra code doesn't slow the first screen.
- Update the `AGENTS.md` RoleAvatar rule: the owner shows the square bot, and other roles show a coloured initial.
