# QA pass on the Ledge Ops admin panel

A hands-on test of what just went live: the internal sign-in page and the five Ops screens. No code changes in this pass — I walk the panel the way you and your team will, list everything I find with a severity, and only fix after you say so.

## What I will test

**Getting in**
- Visiting any Ops address while signed out lands on the internal sign-in card, and after signing in you continue to the page you originally asked for.
- Username `admin` with the right password signs in; a wrong password is refused with the same neutral message; a blank form does nothing harmful.
- Signing in twice, refreshing mid-session, and returning after closing the tab all behave.
- Sign out returns to the sign-in card and the Ops pages are unreachable again afterwards.

**Keeping customers out**
- A customer account signed into Ledge that visits the Ops address still gets the 404 page, with no trace of the panel in the menu or anywhere else in the app.
- Asking the platform for cross-business figures directly from a customer's browser is refused by the database, not just hidden by the screen.
- The shared team login has no Ledge business of its own, so it must never be able to reach the customer app or see business data through it.

**The five screens, with the numbers checked**
- Overview: every tile (businesses, registered users, active businesses, orders, billed value, collected, trials ending, open errors) compared against the database one by one.
- Businesses: search by business and by owner email, paging, the trial badge, and one workspace's row figures reconciled against its real orders and bills.
- Business detail: team list, usage chart, recent errors, and opening a workspace with no orders at all.
- People: search, paging, roles shown correctly, and confirmation that team logins stay out of both this list and the user count.
- Health and Activity: newest-first order, the unresolved/all toggle, and correct business and person names against the records.

**Edges that usually break**
- An address for a business that does not exist, or a malformed one.
- Search terms with quotes, percent signs and very long text.
- Empty states on every screen rather than a spinner that never stops.
- Slow or dropped connection: does a screen say something, or sit blank?
- Phone width (393px) and desktop: tables that scroll rather than overflow, tap targets, header behaviour.

**The audit trail**
- Every page opened and record looked at writes a row naming who did it, and the rows match exactly what I did during the walk.

## How I will report

One list, each finding with what I did, what happened, what should happen, and a severity:
- Blocker — someone can see what they must not, or the panel is unusable
- Serious — a figure is wrong or a screen breaks
- Minor — wording, layout, missing empty state

Then you pick what gets fixed.

## Technical notes

Headless Chromium against the running app at both 393x852 and 1280x1800. Sessions minted per account (shared `admin` login, your own account, and a customer account) rather than sharing one. Every displayed figure cross-checked with a direct read-only database query, and `platform_audit_log` inspected at the end. Read-only throughout: no customer records created, edited or deleted.
