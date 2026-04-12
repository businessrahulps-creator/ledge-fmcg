

# Fix Stale Updates & Unexpected Logouts

## Two Problems

**1. Users see updates late**: The PWA service worker uses `registerType: "autoUpdate"` which silently updates in the background — but only when the browser checks (typically on navigation or page load). Users on long-lived tabs (common on mobile) can go hours/days without seeing new code. There's no reload prompt and no periodic check.

**2. Users get logged out when inactive**: When a mobile browser suspends a tab (or a user leaves the app idle), the Supabase access token expires (default: 1 hour). `autoRefreshToken` only works while JS is actively running. When the tab resumes, the stale token isn't immediately refreshed, and the auth state listener fires with `null` — triggering a redirect to `/login`. The app needs to re-attempt session recovery when the tab becomes visible again.

## Solution

### Fix 1: PWA Update Prompt (service worker)

Switch from silent `autoUpdate` to `prompt` mode so users see a toast when a new version is available, with a "Reload" button.

**`vite.config.ts`**: Change `registerType` from `"autoUpdate"` to `"prompt"`

**`src/main.tsx`**: Import `useRegisterSW` from `virtual:pwa-register/react` isn't needed since we're not in a React component here. Instead, use the vanilla `registerSW` from `virtual:pwa-register` to:
- Call `updateSW()` on the `onNeedRefresh` callback after showing a confirmation
- Check for updates every 60 seconds via `setInterval(() => registration?.update(), 60_000)`

**`src/components/UpdatePrompt.tsx`** (new): A small toast-style banner that appears when a new version is detected. Shows "A new version is available" with a "Reload" button that calls `updateSW(true)`. Rendered in `App.tsx`.

### Fix 2: Session Recovery on Tab Resume

**`src/context/AuthContext.tsx`**: Add a `visibilitychange` listener inside the auth `useEffect`. When the document becomes visible again, call `supabase.auth.getSession()` to re-validate the session. If a valid session exists, update state; if not, the existing logout flow handles it gracefully. This prevents the "sudden logout" where the token expired while the tab was backgrounded.

```typescript
// Inside the auth useEffect, after setting up onAuthStateChange:
const handleVisibility = () => {
  if (document.visibilityState === 'visible') {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!mountedRef.current) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) fetchProfile(sess.user.id);
    });
  }
};
document.addEventListener('visibilitychange', handleVisibility);
// Clean up in the return
```

## Files Changed

| File | Change |
|------|--------|
| `vite.config.ts` | Change `registerType` to `"prompt"` |
| `src/main.tsx` | Add periodic SW update check (every 60s) |
| `src/components/UpdatePrompt.tsx` | **New** — toast banner for "New version available → Reload" |
| `src/App.tsx` | Render `<UpdatePrompt />` |
| `src/context/AuthContext.tsx` | Add `visibilitychange` listener to re-validate session on tab resume |

**1 new file, 4 files modified. No new dependencies. No database changes.**

