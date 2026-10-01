# Fix the "You have unsaved changes" pop-up showing when you haven't left the order form

## What's happening
This isn't a crash. It's the safety check on the New order form, which asks before you leave a half-filled order. It's meant to show only when you actually go to another page. Right now it shows too often:

- As soon as you pick a dealer, the form starts guarding, and the guard's own first step counts as "leaving". So the pop-up can appear while you're still on the form.
- Tapping things that keep you on the same page, like opening Menu, can also count as leaving.

The check compares the page you're on with the full web address of the next step. The two are written differently even when they point to the same page, so the check thinks you're leaving.

## The fix
- Compare only the page part of both addresses. The pop-up then shows only when you really go to a different page.
- The guard's own first step skips the check completely.
- Nothing else changes: closing the tab, the back button and moving to another page with a half-filled order still ask first.

## How I'll check it
- On a phone-sized screen: pick a dealer and confirm no pop-up appears. Tap Menu and confirm no pop-up appears.
- Tap Dashboard with a half-filled order and confirm the pop-up does appear. Cancel keeps you on the form; OK leaves.
- After the order is saved, confirm no pop-up appears.
- Add an automatic check for these cases.

## Technical details
- `src/hooks/use-unsaved-changes-guard.ts`: resolve `nextUrl` with `new URL(String(nextUrl), location.href)` and compare its `pathname` to `location.pathname`. Use `originalPush` for the sentinel history entry instead of the overridden `pushState`.
- New test in `src/hooks/__tests__/`.
