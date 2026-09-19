# Empty screens on desktop while the phone shows everything

## What I found

The data is definitely there: the demo business "Rahul Ps Traders & Co" holds 591 orders and 81 dealers, and your login is attached to that business with full owner access. So nothing was lost.

The failure is in how the app behaves when the first data load fails. Today, if that load breaks — a dropped connection, or a login token that expired while the tab sat open — the app quietly gives up, stops the loading spinner and shows blank screens with zeros. It looks exactly like "there is no data". Your phone had a stored copy from earlier use, so it kept showing the real numbers.

The app's own error records back this up: three recent entries for the first data load, two "couldn't reach the server" and one "login expired", each one leaving the screen empty with nothing said to the user.

## What I'll do

1. Stop the silent failure. When the first load fails, show a clear "Couldn't load your data" message with a Retry button instead of empty screens and zeros.
2. Retry automatically once before showing that message, so a single network blip fixes itself.
3. If the login token expired, refresh it and retry rather than showing a blank app.
4. Fall back to the stored copy when one exists, even when the device is online, and label it as "showing your last saved copy".

## Checks after the change

- Load the app normally on a desktop-sized screen and confirm all 591 orders, dealers, bills and money figures appear.
- Simulate a failed load and confirm the message and Retry appear instead of zeros, and that Retry recovers.
- Simulate an expired login and confirm the app recovers by itself.
- Run the test suite, type check and build.

## Technical notes

- `src/context/DataContext.tsx` `fetchAll` catch block: currently logs and only falls back to cache when `!navigator.onLine`, then `finally` clears `loading` — cold start therefore commits nothing and renders empty. Add a `loadError` state to the context, set it on a cold-start failure, and expose a `retry()`.
- One automatic retry with a short backoff before surfacing `loadError`; on a `JWT expired` style failure call `supabase.auth.refreshSession()` and retry once.
- Cold-start cache fallback becomes unconditional (drop the `!navigator.onLine` guard) and keeps `isOfflineData` true so the existing stale-copy banner shows.
- Surface `loadError` in `AppLayout` as a dismissible bar with Retry; pages keep rendering, so no route-level changes.
- No change to any figure, formula, permission or route.
