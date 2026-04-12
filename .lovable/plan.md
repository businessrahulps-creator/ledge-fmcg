

# Disable Email Auto-Confirm

## What
Turn off automatic email confirmation so new users must verify their email address before they can sign in. This is a single configuration change — no code modifications needed.

## How
Use the `configure_auth` tool with `auto_confirm_email: false`. This ensures that after signup, users receive a confirmation email and must click the verification link before their account becomes active.

## Impact
- New signups will see a "Check your email" message instead of being logged in immediately
- Existing confirmed users are unaffected
- The signup flow in `Signup.tsx` already handles the post-signup state correctly — no code changes required

