

# Forgot Password Flow — Bug #8 Fix

## Overview
Add a dialog modal to the Login page for password reset, triggered by the existing "Forgot password?" button.

## Changes (single file: `src/pages/Login.tsx`)

1. **Add state**: `forgotOpen` (boolean), `resetEmail` (string, initialized from login email), `resetLoading` (boolean)

2. **Wire the "Forgot password?" button** (line 76) to open the dialog and pre-fill `resetEmail` with current `email` value

3. **Add reset handler**: calls `supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: window.location.origin })`, shows success toast regardless, error toast on network failure, closes dialog on success

4. **Add Dialog** using existing `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogDescription` components:
   - Email input (pre-filled)
   - "Send Reset Link" button with loading spinner
   - Closes on success

5. **Imports**: Add `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` from `@/components/ui/dialog`

## No other files touched
- No AuthContext changes
- No new routes or pages
- Login form, show/hide password, and all existing UI unchanged

