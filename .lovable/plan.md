# Profile button next to the bell

## What you'll see

**On a computer**
- The "Super Admin" text in the top bar is gone.
- A round profile picture sits right next to the bell. It shows your first initial, and its colour depends on your access level.
- Clicking it opens a small menu:
  - Your name, email, and an access label such as "Owner (Super Admin)"
  - **Settings**, shown only to people who are allowed to open it
  - **Sign out**
- Settings is removed from the bottom of the left sidebar, so there's only one way in.

**On a phone**
- The top bar stays as it is.
- In the Menu sheet, the plain circle with your initial becomes the same coloured role picture.
- Sign out stays where it is now.

## How each access level looks

Each level gets its own colour and a tiny icon in the corner of the picture:

| Access | Colour | Tiny icon |
|---|---|---|
| Owner (Super Admin) | Midnight | Crown |
| Sales manager | Forest | Bar chart |
| Accountant | Terracotta | Wallet |
| Salesperson | Slate | Shopping bag |
| Viewer | Muted grey | Eye |

All colours come from the existing Ledge colours, and the role labels use the same everyday words as the rest of the app.

## Review
Before building, Astra will check the plan for gaps: people who use only the keyboard, screen readers, small laptop screens, and people with no role yet. After building, it will review the finished change too. I'll fix every real issue it finds.

## Checks
- On a computer: the picture shows, the menu opens, Settings opens the Settings page, and Sign out works.
- People without team access don't see Settings in the menu.
- On a phone: the top bar is unchanged and the Menu sheet shows the role picture.
- All existing automatic checks still pass.

## Technical details
- New `src/components/layout/RoleAvatar.tsx`: one table that maps each role to a label, a colour and an icon. Sizes: `sm` for the top bar, `md` for the Menu sheet. Missing role falls back to the Viewer style.
- New `src/components/layout/ProfileMenu.tsx`: built on the shadcn DropdownMenu, with `hidden md:inline-flex` so it only appears on computers. Settings shows only when `useCan("manage_team") === true`. Sign out calls `signOut()` from AuthContext. Has `aria-label="Account menu"` and `touch-target`.
- `AppLayout.tsx`: remove the role text and its separator (lines ~287-294); put `<ProfileMenu/>` right after `<NotificationCenter/>`; swap the Menu sheet's initial circle for `<RoleAvatar size="md"/>` and keep the online dot.
- `nav-config.ts`: set `NAV_FOOTER` to `[]` so the sidebar no longer shows Settings. The phone Menu still lists Settings from the shared list.
- Record in `AGENTS.md`: the account menu (Settings + Sign out) lives in the top bar on computers; role styling has one home in RoleAvatar.
