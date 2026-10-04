# Final Activity pass: confirm every fix, find new bugs

Last review of the Activity page, history recording and the bell. "Ashwa" is read as Astra. Fable 5.5 isn't available, so the newest Fable (5.1) does the review.

## 1. Live re-check of all 14 earlier fixes
Each fix gets a live test against the real backend or the browser, not just a code read. Every test is undone or clearly labelled as a QA entry afterwards.
- People with team access but no money access can't see amounts. Check: sign in as a test user with team-only access, if I can make one safely.
- A cancelled payment shows "−₹". Check: read the history entry for a payment that was cancelled earlier.
- Order amounts subtract offer savings and match the Orders total.
- "Load more" doesn't skip entries; entries just before India midnight are included; "Today" moves to the new day after midnight. Check: date-boundary queries plus browser tests with a faked clock.
- Totals refresh live, and the list doesn't jump to the top. Check: two browser tabs open, add an entry in one and watch the other.
- Switching dates quickly or switching accounts doesn't show the wrong entries.
- Download saves the whole period and leaves out amounts for people without money access.
- Cancelled orders count by the day they were cancelled.
- Links work: a failed new-order alert opens Orders, and payment, credit note, buying and team alerts open the right pages.
- Fake failure messages are refused, and failure alerts are capped at one every 10 minutes.
- The Person filter keeps showing every name after you pick one.

## 2. Bell reaching another person
If I can, I'll add a temporary second team member to the test business. Then I check that alerts arrive for them, bundle repeats, stay hidden from people without money access, and never alert you about your own actions. I remove the test member afterwards. If adding one isn't possible, I'll say so.

## 3. New-bug hunt, two separate reviews
- **Astra:** reviews the database side (recording, alerts, totals, permissions) for gaps, wrong numbers and data leaks.
- **Fable 5.1:** reviews the Activity page, the bell, Download and the phone layout, and also tries to break the fixes above.
- I check every finding myself and only fix the real ones. Each fix gets a live re-test.

## 4. Done when
- All automatic checks pass and the build is clean.
- The Activity page and the bell work on computer and phone with no errors.
- The report lists: fixes confirmed live, new bugs fixed, findings I rejected and why, and anything I couldn't test.

## Technical notes
- New migrations only, with nothing breaking. History stays locked from editing.
- Live database tests go through the REST API with a session from `lovable auth-session`. Browser tests use Playwright scripts in /tmp/browser/activity.
- GST documents and money balances are never changed. Any test money entries are reversed with audited voids.
