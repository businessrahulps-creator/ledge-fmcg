# Using "e2e" by TesterArmy to test Ledge

## What it is
It's an open-source testing tool, not a report. You write a test in plain English, like "take an order for Adyar Wholesale and send it with a bill". An AI then clicks through the app in a real browser to do it, and checks the result. Once a test passes, the tool remembers the clicks and replays them with no AI next time. It only asks the AI again when a screen changes. It runs on the same browser engine our current checks already use, and on iPhone and Android test phones too.

## Why it fits Ledge
- Our 377 automatic checks test the maths and the rules. They don't click through screens. The 3 old screen tests we have are switched off because they can't sign in.
- Bugs you've found yourself (the "unsaved changes" pop-up, the dashboard stuck on "Refreshing…", pages opening halfway down) were all screen bugs. This tool catches that kind.
- Plain-English tests are easy for you to read and add to, with no coding.

## What we'd build
1. Set up the tool with a saved sign-in for the demo owner (asha@getledge.in), so tests start signed in.
2. Write about 12 plain-English tests for the money-critical journeys, each checking the real numbers on screen:
   - Take an order → Send & make bill → stock goes down
   - Record a part payment, then the rest; paying too much is refused
   - Return goods → credit note → dealer's unpaid amount goes down
   - Cancel an order (hold to confirm) → it disappears from the totals
   - Purchase bill → pay supplier → supplier balance matches
   - Shop visit with a promise → it shows under Promises
   - New shop → Make dealer → order form opens with that dealer
   - Download every report as PDF, Excel, CSV, plus the Tally file
   - Dashboard, Money to collect and dealer statement show the same unpaid total
   - Phone size: every menu item opens, nothing is cut off, the bottom bar works
   - Leaving a half-filled order asks first, and nothing else does
   - Moving between pages opens each one at the top
3. Role tests once you invite a test salesperson and manager: they must not see payments or Buying.
4. Run all tests before each publish, with a plain pass/fail list and screenshots of failures.

## What it costs
- Free tool (Apache-2.0 licence). The AI part uses Lovable AI, so first runs spend a small number of credits. Repeat runs cost nothing until a screen changes.
- It's still before version 1.0, so some settings may change in updates.
- It sends anonymous usage counts by default. We'd switch that off.

## Limits
- It can't test real TallyPrime, a real slow phone, or two people tapping at the same second.
- Tests make real records in the demo business. Each one gets a clear "E2E" name so they're easy to spot and clean up.

## Technical details
- Add the `e2e` and `@e2e-dev/web` dev packages, with config under `e2e-agent/`. Keep the existing Playwright e2e folder.
- Auth: storage state built from `lovable auth-session`, injected per run, never committed.
- Model: Lovable AI Gateway (`openai/gpt-6-astra`) via the tool's OpenAI-compatible provider. Fall back to plain locator tests if the provider setup doesn't fit.
- Every agent step is followed by hard locator/number assertions, so the AI never decides on its own whether a test passed.
- Set `E2E_TELEMETRY_DISABLED=1`.
- Record the rule in AGENTS.md.
