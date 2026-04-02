

# Move Logout to Settings Page

## Why
- Logout in the bottom nav wastes space and is an unusual pattern — most apps put it in Settings/Profile
- Frees up room in the mobile nav bar, reducing the need to scroll

## Changes

### `src/components/layout/AppLayout.tsx`
- Remove the Logout `<Link>` from the bottom nav (the last item pointing to `/`)

### `src/components/layout/AppSidebar.tsx`
- Remove logout from the sidebar footer if present (need to check)

### `src/pages/Settings.tsx`
- Add a "Logout" section at the bottom of the page — a simple card with a red "Log Out" button
- On click, show a confirmation dialog ("Are you sure you want to log out?"), then navigate to `/`
- Style: destructive variant button with `LogOut` icon

