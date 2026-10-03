# Astra QA review of the recent speed changes

## Goal
Have Astra (most powerful model, full context) review everything changed in the last speed rounds, find real bugs and remaining slow spots, then fix only confirmed problems.

## What Astra reviews
1. Startup data loading — order lines, offers and return lines now arrive together with their orders/returns. Check nothing is missing past 1,000 orders, sorting is stable, and saved (cached) data never shows another business's data.
2. Sign-in loading — profile and role load once. Check sign-out / switching account never shows the previous person's data or permissions.
3. Permissions in one request — check every button/page guarded before still is, and nothing flashes as "allowed" before permissions arrive.
4. New database indexes — confirm they are used, and spot missing ones using the slow-query report.
5. Lazy search palette, report export pause, faster list rows, scroll reset — check for broken keyboard shortcuts, cut-off rows, find-on-page, phone layout.
6. Request timeout + retry — check retries can never double-save a payment or order (only reads retry).
7. Remaining speed — re-time cold load on phone and computer, list the biggest leftover delays.

## How
- Send Astra the full changed files plus the money rules (balances, GST bills, stock) in large batches; ask for findings with file/line and proof.
- I verify every finding myself (code read, database query or browser test) before fixing — Astra never decides alone.
- Fix confirmed bugs and safe speed wins only. No change to how money, GST or stock numbers are calculated; the "Dashboard asks server for totals" idea stays waiting for your OK.

## Done when
- All 380 automatic checks pass; ₹1,63,75,418 total still matches.
- Dashboard, Orders, Money to collect re-timed on phone and computer, before/after shown.
- Short report: bugs found, fixed, rejected (with reason), and any items needing your decision.

## Technical details
- Files: DataContext.tsx, AuthContext.tsx, useCan.ts, AppLayout.tsx, exporters.ts, index.css, vite.config.ts, migrations 0029/0030, fetch timeout wrapper.
- Model: openai/gpt-6-astra via Lovable AI gateway (script, not app code); Supabase slow_queries + EXPLAIN on hot queries; Playwright cold-load timing at 393px and 1280px, normal and throttled network.
- Credit budget: within your earlier 150-credit ceiling unless you say otherwise.
