# Real-device pass before calling it a day

No code changes planned. This is a walkthrough of the running app at phone size,
driving it the way a real user would, and reporting what I find. If something is
broken I'll list it with severity and only fix it after you say so.

## What I'll check

**Getting in**
- Sign-in page at 393px: nothing clipped, Google button works, error messages readable.
- The first screen after sign-in: no black screen, no flash of "no access", no
  unstyled dashboard.

**The daily loop**
- Book an order: dealer search, product picker, quantity, offers applied, the date
  field, the Summary block and the Save bar not overlapping.
- Double-tap Save: still only one order.
- Open the order, dispatch it, raise the bill, take a payment, take a part payment,
  try to overpay.
- File a return against the billed order.

**The money screens**
- Billing list, Money to Collect, aging, a dealer statement.
- Totals on screen reconcile with the order and the bill.

**Documents**
- Download the GST bill, the order confirmation, a dealer statement and a report
  export. Check layout, the rupee symbol, amount in words, page breaks.

**Phone behaviour**
- Every main screen at 393px: no horizontal scroll, tap targets reachable,
  bottom bar not covering content, search working.
- Menu navigation feels responsive, loading states appear rather than blank screens.

**Recovery**
- Reload mid-session and after a cache clear — the app should recover, not show a
  fallback screen.

## What I can't cover
Real iPhone Safari rendering, true 3G throttling, and two people acting at the same
moment on two devices. Those need your hands on actual phones.

## Output
One list: what worked, and any finding with a severity and the smallest fix. Then
you decide what, if anything, gets changed before you call it done.

## Technical notes
- Headless Chromium against `http://localhost:8080`, viewport 1280x1800 for wide
  checks and 393x852 for the phone pass, screenshots per screen.
- Session restored from the existing preview auth session; if none is available I'll
  mint one for your own account rather than guessing a user.
- Console errors, failed network calls and runtime errors captured per route.
- Read-only intent, but the order/bill/payment/return walk does create real records
  in the workspace — I'll use an obviously-named test dealer and tell you exactly
  what was created so it can be cleaned up.
