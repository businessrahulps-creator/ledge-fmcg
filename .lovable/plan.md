

# Fix: Logged-in Users Sent to Landing Page on Reopen

## Problem
The root route `/` always shows the landing page regardless of auth state. When users close the app and reopen it, the browser navigates to `/` (the default), shows the marketing landing page, and users think they've been logged out — even though their session is still valid in localStorage.

## Root Cause
The `Index` component (landing page) never checks if a user is already authenticated. It should redirect logged-in users straight to `/dashboard`.

## Fix

### `src/pages/Index.tsx`
Add an auth check at the top of the component:
- Import `useAuth` from AuthContext
- If auth is still loading, show a brief spinner (prevents flash of landing page)
- If user exists, `<Navigate to="/dashboard" />` immediately
- Otherwise, render the landing page as usual

This is a single-file, ~10-line change. Session persistence already works — the Supabase client stores tokens in localStorage and `AuthProvider` restores them via `getSession()`. The only missing piece is the redirect.

### Files Changed
- `src/pages/Index.tsx` — redirect authenticated users to `/dashboard`

