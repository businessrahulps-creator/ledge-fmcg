# Final verification — 20 November 2026

## Verdict: conditional pass; live role verification incomplete

All six scoped fixes are implemented and committed. The full automated suite passes: **65 files, 576 tests**. This is not a completed four-role release sign-off.

## Findings

| Finding | Implementation | Verification |
|---|---|---|
| SEC-01 Sales Team | Financial displays/export gated; non-money ranking uses orders | Automated permission/export checks pass; owner screen and downloaded export checked |
| SEC-02 Salesperson detail | Financial summaries, payment indicators, revenue progress and PDF gated | Page permission tests pass; owner desktop/phone checked |
| SEC-03 Targets | Money inputs/progress hidden; hidden revenue goals preserved on order-target changes | Page/save tests pass; owner desktop/phone checked; no target saved |
| SEC-04 Dealer detail | Ledger, money summaries, statements and financial share gated | Page/share tests pass; owner direct ledger link checked; restricted-role direct-link live check pending |
| UI-01 Stock | Valuations require manage_stock OR see_money; quantities unchanged | Four capability combinations tested; owner sees three godown values; restricted-role live checks pending |
| DOC-01 Returns | GST and BOS issued states explicitly accepted; drafts/cancelled/unknown/unlinked rejected | 19 eligibility checks and six unit checks pass; owner selected ORD-2026-0032 and saw BOS/2026-27/0023 with its remaining quantity; no return saved |

## Browser evidence actually collected

- Owner and Accountant verified in separate injected sessions; Accountant role confirmed through the signed-in account's server role row. Real existing records, not mocked data.
- Sales Team, Rohith detail, Targets, test dealer direct ledger link and Stock opened at 1280×1800 and 390×844.
- No document-wide horizontal overflow at the phone size on those five screens.
- No JavaScript page errors during this browser run.
- Owner Sales Team download inspected: Name, Phone, Email, Region, Total Orders, Total Value.
- Owner ledger remained selected and displayed the existing two bills, two payments and four credit notes.
- Screenshots inspected for owner phone salesperson detail and desktop ledger.
- Prior DOC-01 live check selected the real BOS bill without submitting a return.
- Preview reported build OK after the implementation edits; no application-code changes in this verification step.

### Accountant live verification

- All five audited screens opened at 1280×1800 and 390×844; no document-wide phone overflow and no JavaScript page errors in the five-screen run.
- Authorized financial figures remained visible in Sales Team, Rohith detail and Targets; the direct dealer ledger URL selected Bills & payments.
- Downloaded Sales Team report inspected: Name, Phone, Email, Region, Total Orders, Total Value.
- Three godown valuations remained visible. Opening Main warehouse - Thrissur showed Quantity and Est. Value columns; no Add Stock button was present, preserving viewing without stock-editing rights.
- Selected ORD-2026-0032 and confirmed the return dialog for BOS/2026-27/0023 and its remaining one Pack; no return submitted.
- Inspected screenshots of stock inventory, phone salesperson detail and the selected BOS return dialog.
- No application code changed, transactions saved or publication performed during this Accountant check.

## Still required before full sign-off

Accountant live checks are complete for this scope. Sales Rep and Viewer live checks are **NOT VERIFIED**. Minting another account's session was refused because the requesting workspace account lacks owner/admin permission; the user instead signed into the preview as Accountant. No permissions were changed and no substitute role was mocked. The next check needs Sales Rep signed into the Lovable preview, followed by Viewer.

Check each role's five screens and direct dealer ledger URL; inspect non-money team export for omitted Total Value; confirm no money appears in restricted page views, and check authorized accountant godown values. Automated checks do not replace these live checks.

## Remaining risks outside this scope

- This is screen/export gating, not server-side financial read isolation. Existing shared data loading still makes some financial fields available to workspace members through allowed reads. A separate server-access redesign is needed for strict data-level secrecy; do not represent these fixes as that redesign.
- Earlier tagged QA financial records and obsolete invites remain; no deletion or cleanup was authorized in this pass.
- The earlier QA report documents historical defects; the six-finding table above describes this pass, not a fresh exhaustive transaction audit.

## Change control

No orders, payments, returns, targets, assignments or business permissions were saved during this verification step. No database migrations were applied. No publication performed.