

# Mobile "More" Tab — Bottom Drawer

## What
Replace the 5th mobile tab (Dealers) with a **"More"** button that opens a swipe-up bottom drawer listing all secondary pages. Desktop sidebar stays untouched.

## Bottom bar becomes
`Home · Orders · Godown · Reports · More`

## Drawer contents
- Dealers, Products, Salespersons, Settings (each with icon)
- Divider
- Log out

## File: `src/components/layout/AppLayout.tsx`
- Trim `mobileNav` to 4 items (drop Dealers)
- Add `useState` for drawer open/close
- Render 5th tab as "More" with `MoreHorizontal` icon — highlights when current route is any secondary page
- Import `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle` from existing Vaul component
- Drawer body: list of `Link` items with icons, `onClick` closes drawer
- Log out link at bottom after `Separator`

No new dependencies. No other files change.

