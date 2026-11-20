# Final verification — 20 November 2026

## Verdict: scoped verification passed; broader release remains conditional

All six scoped fixes are implemented and committed. The full automated suite passes: **65 files, 576 tests**. Owner, Accountant, Sales Rep and Viewer live screen/export checks are complete for these six findings. This is a scoped sign-off, not a claim of strict database-level financial secrecy or a fresh exhaustive transaction audit.

## Findings

| Finding | Implementation | Verification |
|---|---|---|
| SEC-01 Sales Team | Financial displays/export gated; non-money ranking uses orders | Automated checks and all four roles' screens/downloads pass; restricted exports omit Total Value |
| SEC-02 Salesperson detail | Financial summaries, payment indicators, revenue progress and PDF gated | Page tests and all four roles' desktop/phone checks pass; restricted views omit money and PDF |
| SEC-03 Targets | Money inputs/progress hidden; hidden revenue goals preserved on order-target changes | Page/save tests and all four roles' desktop/phone checks pass; no live target saved |
| SEC-04 Dealer detail | Ledger, money summaries, statements and financial share gated | Page/share tests pass; authorized ledger visible; Sales Rep/Viewer direct links render Overview without ledger |
| UI-01 Stock | Valuations require manage_stock OR see_money; quantities unchanged | Capability tests pass; Owner/Accountant values visible; Sales Rep/Viewer views and downloads omit valuations, retain quantities |
| DOC-01 Returns | GST and BOS issued states explicitly accepted; drafts/cancelled/unknown/unlinked rejected | 25 checks pass; Owner/Accountant selected real BOS/2026-27/0023 without saving; Sales Rep/Viewer denied Returns access |

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

## Restricted-role live verification

### Sales Rep live verification

- Confirmed the injected session's server role is salesperson before checking real records.
- Sales Team, Rohith detail, Targets and the direct dealer ledger link showed zero rupee values on desktop and phone; Statement PDF was absent.
- The direct dealer `?tab=ledger` URL rendered Overview selected with no Bills & payments tab. The URL query itself remains unchanged; unauthorized ledger content does not render.
- Sales Team download contained Name, Phone, Email, Region, Total Orders (two rows); Total Value was absent.
- Stock godown cards showed no rupee values. Main warehouse inventory retained its Quantity column but omitted Est. Value. Inventory download retained product prices as approved, but omitted Stock Value (nine rows).
- Catalogue product prices remain visible in Stock as intentionally preserved by the approved scope; this is not total financial secrecy.
- Direct `/claims` access showed “You don't have access to this” with no Record return button.
- No document-wide phone overflow on the five audited screens and no JavaScript page errors during the run. Inspected desktop dealer overview and inventory screenshots plus phone salesperson detail.
- No application code, permissions or transactions changed; no publication performed.

### Viewer live verification

- Confirmed the injected session's server role is viewer before checking existing records.
- Checked Sales Team, Rohith detail, Targets, the direct dealer ledger link and Stock at 1280×1800 and 390×844, plus direct Returns access on desktop.
- Sales Team, salesperson detail, Targets and dealer overview contained zero rupee values; Statement PDF was absent. Direct `?tab=ledger` selected Overview with no Bills & payments tab.
- Downloaded Sales Team report contained Name, Phone, Email, Region, Total Orders (two rows), with no Total Value.
- Godown cards showed no valuations. Main warehouse inventory retained Quantity but omitted Est. Value; its download retained Quantity and Price before GST, but omitted Stock Value (nine rows). Catalogue prices remain visible as intentionally approved.
- Direct `/claims` showed “You don't have access to this” and no Record return button.
- No document-wide phone overflow on all five screens; no JavaScript page errors. Inspected desktop dealer overview and warehouse inventory screenshots and phone salesperson detail.
- No application code, permissions or transactions changed; no publication performed.

All four roles' scoped live checks are complete. Earlier session minting was refused; the user signed into each account through the preview instead. No permissions were changed and no substitute role was mocked.

## Remaining risks outside this scope

- This is screen/export gating, not server-side financial read isolation. Existing shared data loading still makes some financial fields available to workspace members through allowed reads. A separate server-access redesign is needed for strict data-level secrecy; do not represent these fixes as that redesign.
- Earlier tagged QA financial records and obsolete invites remain; no deletion or cleanup was authorized in this pass.
- The earlier QA report documents historical defects; the six-finding table above describes this pass, not a fresh exhaustive transaction audit.

## Change control

No orders, payments, returns, targets, assignments or business permissions were saved during this verification step. No database migrations were applied. No publication performed.