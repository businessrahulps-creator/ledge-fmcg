# Remove splash regressions and stabilize mobile navigation

## Goal
Make Ledge open and navigate like one continuous app: no startup animation covering page changes, no full-screen branded loader during normal navigation, no navy flash behind light pages, and a light phone status area matching the app.

## Confirmed causes
- The animated opening screen is embedded directly in the initial page and the page background is permanently forced to Midnight, so every full document reload recreates the splash and can leave a navy flash behind the light interface.
- The global asset-failure listener currently treats every failed stylesheet as an app failure, including the optional Google Fonts stylesheet. A font/network hiccup can therefore clear caches and reload the whole app.
- Two normal actions on the Targets page use full browser navigation rather than in-app navigation, which reruns the startup document and its splash.
- The web-app manifest and browser theme metadata currently request Midnight for phone chrome, while the normal app surface is light.
- Protected screens and capability checks can still render a separate full-screen `SplashScreen`; normal route changes already have layout-preserving skeletons and a top progress indicator.

## Changes
1. **Retire the animated startup overlay**
   - Remove the inline animated splash, progress copy, timers, and startup bridge calls.
   - Keep only a minimal, non-animated first-paint background so a cold launch never shows black while the app bundle starts.
   - Use the light Bone app surface for that first paint, matching the loaded interface.

2. **Keep navigation inside the app**
   - Replace the two hard redirects on Targets with router navigation.
   - Audit internal navigation call sites and retain full reloads only for explicit update, retry, or stale-file recovery actions.
   - Preserve the existing top progress indicator and page-shaped skeletons for genuinely slow page downloads; these do not cover the whole app shell.

3. **Remove full-screen splash fallbacks from authenticated navigation**
   - Replace authentication/capability waiting states with a lightweight shell-compatible loading state.
   - Ensure the top bar and bottom navigation remain stable while a destination page becomes ready.
   - Do not change authentication, permissions, data loading, or business rules.

4. **Stop false recovery reloads**
   - Restrict stylesheet recovery to the app’s own same-origin built stylesheet, excluding Google Fonts and other optional external styles.
   - Keep one-shot stale-file recovery for missing JavaScript/CSS releases, but show a small “Updating Ledge” state rather than the retired splash.
   - Preserve the inline-styled final Retry screen for the rare case where core files still cannot load.

5. **Restore a light phone status area**
   - Set browser theme and manifest theme/background colours to the light Bone surface.
   - Keep iOS status-bar behaviour light and ensure safe-area spacing remains correct.
   - Remove the unconditional Midnight `html/body` startup colour that caused the changed notch area and navy flashes.

## Verification
- Test cold launch and repeated navigation across Home, Orders, Stock, Insights, Targets, Dealers, and Sales Team at 393×706.
- Confirm no animated/full-screen splash appears after the initial document starts or during in-app page changes.
- Confirm top and bottom navigation remain visible during lazy page loading.
- Simulate an external font failure and verify it does not reload or clear the app.
- Simulate a missing app chunk and verify recovery still runs once, without a loop.
- Verify the phone status area and launch background are light, with no navy/black flash.
- Run the existing tests and confirm the preview build is clean.

## Scope protection
No changes to orders, GST, totals, payments, stock, permissions, database behaviour, or offline mode. This is limited to startup presentation, navigation continuity, recovery guards, and mobile chrome colour.
