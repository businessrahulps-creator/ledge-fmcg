# Pre-publish QA — 19 November 2026

## Requested fixes
- Dashboard money, financial charts, payment statuses, overdue links and money-based AI explanations require see_money. Dealer list is alphabetical without money access (no financial ranking leak).
- First-week business setup guide requires manage_business.
- Greeting uses Asia/Kolkata regardless of device timezone.
- Four existing role logins tested through actual email sign-in. Manager/Accountant keep financial Dashboard; Sales Rep/Viewer see none. All four see no owner setup guide. India afternoon greeting checked with browser timezone America/Los_Angeles.
- 534 regression tests passed, including six new access/time-boundary checks; preview build OK.

## Real transaction checks
| Role | Order save | Payment save | Return save |
|---|---|---|---|
| Manager | Saved through UI | ₹25 saved through UI | 1 good Pack, ₹50 credit, confirmed in-dialog |
| Accountant | Server refused; UI access denied | ₹25 saved through UI | 1 good Pack, ₹50 credit, confirmed in-dialog |
| Sales Rep | Saved through UI | Server refused | **FAILED: server permitted return despite Returns page denying access** |
| Viewer | Server refused; UI access denied | Server refused | Server refused; UI access denied |

Readback confirmed the two posted ₹25 payments, credit notes, good-return ledger rows and order Activity rows. Returns → All lists all test returns. Record another return stays open, preserves test dealer context and returns to bill selection. Actual stock movement occurs through the usual dispatch/return functions; no financial records were deleted or rewritten.

## Test records retained (live shared business)
- ORD-2026-0032: labelled Manager test, existing Lakshmi Agencies, ₹50; BOS/2026-27/0023. Existing dealer credit covers it. One Pack sent.
- ORD-2026-0033 and 0034: isolated dealer `[QA 19 Nov] Test transactions only`, ₹150 each; BOS/2026-27/0024 and 0025; three Packs each sent.
- CN/2026-27/0006 and 0007: Manager and Accountant good returns, ₹50 each.
- CN/2026-27/0008 and 0009: two explicit forbidden-return attempts unexpectedly accepted as Sales Rep, ₹50 each. These exhausted the remaining two Packs on 0033. They remain tagged test history, not erased.
- Final net physical test stock reduction: three Pepsi Packs (seven sent, four returned).

## Additional findings — do not publish yet
These are findings from testing, not fixed in the requested three-Dashboard-fix scope:
1. **Return permission mismatch:** record_return_and_credit_atomic only denies viewer, while the Returns page requires see_money. Sales Rep can create credit notes/restock through the callable function.
2. **Order money visibility/status:** Sales Rep/Viewer still see financial figures on Orders and OrderDetail. Because payments are unavailable to them, paid orders can be shown as unpaid. Dashboard fix does not secure these other screens.
3. **Return balance mismatch:** after a ₹50 return and ₹25 payment on a ₹150 bill, PaymentsPanel shows ₹75 due but the OrderDetail headline still shows ₹125. Needs one canonical receivable calculation in both places.
4. **Delivery timeline:** newly sent orders show `Delivered: Now` in the timeline even though status is On the way and delivery has not been confirmed.

No claim of production readiness. No publish performed. Test sessions/passwords are not stored in project files.