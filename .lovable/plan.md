

# Polished PWA Install Experience

## What Changes

### 1. Create a shared install hook (`src/hooks/use-install-prompt.ts`)
Central hook managing `beforeinstallprompt` event, iOS detection, standalone detection, and localStorage state. Exposes `canInstall`, `isIOS`, `isStandalone`, `triggerInstall()`, `dismiss()`, `dismissForever()`. Tracks engagement milestones (dashboard visit count, first order created) in localStorage.

### 2. Refactor `InstallPrompt.tsx` — contextual smart banner
- Instead of showing on a 3s timer, only show after the user has visited the dashboard 3+ times OR created their first order.
- Update copy: "Install Ledge as an app for fast offline access to orders, stock, and reports — even in godowns."
- Keep iOS step-by-step instructions (Share → Add to Home Screen).
- Keep "Don't show again" and dismiss/never logic.

### 3. Add "Install App" button in desktop header (`AppLayout.tsx`)
- On desktop (hidden on mobile), add a small "Install App" button with Download icon next to the notification bell.
- Only visible when `canInstall` is true and not standalone/dismissed.
- Clicking triggers native `beforeinstallprompt` or shows iOS instructions in a popover.

### 4. Add "Install App" section in Settings page (mobile)
- Add a new card at the bottom of the Company tab (or as a standalone section) with:
  - App icon + "Install Ledge App" heading
  - Benefit text: "Fast offline access to orders, stock, and reports — even in godowns"
  - Install button (Android) or iOS instructions
  - Only shown when not already installed (not standalone)

### 5. Track engagement milestones
- In `Dashboard.tsx`: increment `ledge-dashboard-visits` in localStorage on mount.
- In `NewOrder.tsx`: set `ledge-first-order-created` in localStorage after successful order save.
- The smart banner reads these to decide when to appear.

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/hooks/use-install-prompt.ts` | **Create** — shared PWA install hook |
| `src/components/InstallPrompt.tsx` | **Edit** — use shared hook, contextual trigger, updated copy |
| `src/components/layout/AppLayout.tsx` | **Edit** — add desktop "Install App" button in header |
| `src/pages/Settings.tsx` | **Edit** — add Install App card for mobile |
| `src/pages/Dashboard.tsx` | **Edit** — track visit count in localStorage |
| `src/pages/NewOrder.tsx` | **Edit** — set first-order flag on save |

No changes to manifest, icons, service worker config, or existing functionality.

