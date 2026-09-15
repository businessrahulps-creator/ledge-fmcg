# PDF check: what I found and what to fix

I regenerated PDFs from your real data in a signed-in browser and looked at the pages.

## Working correctly

- Dealers, Products, Payments, Dispatch and Sales Team reports all download and render: letterhead with company name, address and GST number, summary boxes, table header band, rupee amounts, footer with page numbers.
- Snapshot export (3 pages) downloads with repeating headers and page numbers.

## Problems found

1. **Performance report can't be reached any more.** The "Performance" and "Reports" links now both land on the Command page. The old Performance page (with its own PDF export) is no longer reachable, so that report exists in the code but nobody can download it. Same for the old Reports page.
2. **Report exports carry no period label in the summary when a custom range is used** — needs a check while the remaining documents are verified.
3. **Remaining documents not yet re-checked in this pass:** GST bill, order confirmation, dealer statement, salesperson statement, collections list, payments list, orders list.

## What I'll do

1. Restore access to the performance report: either surface it as a section inside Command with its export button, or remove the dead page and its PDF template so nothing unreachable is left. Recommendation: fold the export into Command's overview so the report stays available.
2. Delete the other now-unreachable page and its prefetch entries so links and menus match what actually opens.
3. Generate every remaining PDF from real data (bill, order confirmation, both statements, collections, payments, orders list), render each page as an image, and check for: overlapping text, cut-off columns, missing page numbers, wrong rupee amounts, headings stranded at page ends.
4. Fix whatever the images show, then re-render the affected documents to confirm.
5. Run the type check, the test suite and the build at the end.

## Technical notes

- `/reports` and `/performance` in `src/App.tsx` are `Navigate` redirects to `/command`; `src/pages/Reports.tsx` and `src/pages/Performance.tsx` are unrouted, and `src/lib/route-prefetch.ts` still imports both.
- `PerformanceReportPdf.tsx` is only referenced by the unrouted `Performance.tsx`.
- No change to any number, formula or business rule — presentation and reachability only.
