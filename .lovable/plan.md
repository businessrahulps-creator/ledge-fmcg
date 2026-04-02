

# Notification Center in Top Bar

## Concept
Add a bell icon with unread badge to the right side of the header bar. Tapping it opens a dropdown/popover listing recent notifications. Toasts still appear for immediate feedback, but important events also get logged into the notification center.

## Changes

### New file: `src/components/layout/NotificationCenter.tsx`
- Bell icon button with animated unread count badge (red dot or number)
- Popover dropdown (using existing Popover component) showing a scrollable list of notifications
- Each notification: icon + title + description + relative timestamp + read/unread state
- "Mark all as read" button in the header of the dropdown
- Empty state: "No notifications yet"
- Notification types: order_placed, stock_alert, team_update, general

### New file: `src/hooks/use-notifications.ts`
- React context + hook for managing notifications state
- `addNotification(type, title, description)` — adds to the list
- `markAsRead(id)` / `markAllAsRead()` — clears unread state
- `unreadCount` — computed count for the badge
- Stores notifications in state (mock data for now, can be wired to Supabase later)
- Pre-seed with 2-3 sample notifications so it doesn't look empty on first load

### Modified: `src/components/layout/AppLayout.tsx`
- Import and render `<NotificationCenter />` on the right side of the header (`ml-auto`)
- Wrap the app layout content with `NotificationProvider`

### Modified: `src/pages/NewOrder.tsx`
- After saving an order, also call `addNotification('order_placed', 'New Order Created', 'Order for [dealer] has been placed')`

### Modified: `src/pages/Settings.tsx`
- When a team member is removed, call `addNotification('team_update', 'Team Member Removed', '[name] was removed')`

## UI Details
- Bell icon: `Bell` from lucide-react, sized to match header
- Badge: small red circle with count, absolute-positioned top-right of bell, animated scale-in
- Popover: 320px wide, max-height 400px with scroll, matches existing glass/card styling
- Each notification row: subtle left border color by type, hover highlight, click to mark as read
- Mobile: popover becomes full-width minus padding

## Result
Users get a persistent, reviewable notification history alongside the existing toast system. Clean, lightweight, and ready to be wired to real-time data later.

