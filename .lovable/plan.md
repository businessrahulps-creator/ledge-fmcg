

# Remove Unauthorized Floating Action Button

## Problem
A floating "+" button (FAB) was added to the Dashboard page without authorization. It appears as a fixed circular blue button on mobile at `bottom-24 right-4` linking to `/orders/new`.

## Fix (1 file, delete 8 lines)

### `src/pages/Dashboard.tsx` — Lines 467–474
Remove the entire `{/* Mobile FAB — quick order creation */}` block including the `<Link>` element.

Also need to fix the build error from the previous change: `src/integrations/lovable/index.ts` references `@lovable.dev/cloud-auth-js` which doesn't exist. Need to install it or revert the Google OAuth changes in Login/Signup that depend on it.

