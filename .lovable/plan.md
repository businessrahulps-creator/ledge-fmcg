# Plain-Language Glossary Bundle

Build a single deliverable the team can hand to designers, writers, and field testers: a master glossary mapping every old UI term to its plain-English replacement, with context, rationale, and the screens it appears on.

## What gets produced

A zip at `/mnt/documents/ledge-plain-language-glossary.zip` containing:

1. **`glossary.md`** — Human-readable master glossary, grouped by category (Money, Dealers, Stock, Orders, People, Time, Roles, System). Each entry:
   - **Before** (current term)
   - **After** (plain-language replacement)
   - **Why it was confusing**
   - **Where it appears** (screens/components)
   - **Example sentence** (before → after)

2. **`glossary.csv`** — Same data, flat columns (`category, before, after, why, screens, example_before, example_after, status`). Easy to sort/filter in Excel for the field-testing team.

3. **`glossary.json`** — Same data, machine-readable. Future use: a lint rule that flags banned words in PRs.

4. **`screen-by-screen.md`** — Per-screen diff (Sidebar, Home, Deep Dive, Dealers, Sales Team, Stock, Orders, Settings, Reports, Billing, Notifications, Onboarding, Errors). Each screen lists the exact strings changing.

5. **`banned-words.txt`** — One word per line. The "never ship this word again" list (Dormant, Churn, Pipeline, KPI, MTD, YTD, SKU, Reconcile, Aging, Outstanding, etc.). Drop-in for a future ESLint/Biome rule.

6. **`README.md`** — How to use the bundle: who it's for, how to add a term, how to mark a term "shipped" once the PR lands.

## Source of truth

All entries are pulled from the existing audit at `/mnt/documents/ledge-language-audit.md` (~30+ glossary terms + per-screen replacements already mapped). No new product decisions are made — this is a packaging task, not a re-audit.

## Categories (and approximate counts from the audit)

- **Money** (~8): Outstanding, Aging, Collections, Run rate, Revenue, AOV, MTD/YTD, Reconcile
- **Dealers** (~6): Dormant, Silent & Owing, Churn risk, Distributor, Credit limit, Lifetime revenue
- **Stock** (~5): SKU, HSN, Threshold, Critical/Low/Healthy, Godown
- **Orders** (~5): Pipeline, Funnel, Dispatched, Credit override, Claims
- **People** (~4): Roster, Capability, Promoter/Detractor, Salesperson
- **System** (~5): KPI, Digest, Sparkline, Activity log, Notifications
- **Roles** (~5): Owner, Manager, Accountant, Sales Rep, Viewer (mostly kept — confirm in glossary)

Total: ~35–40 entries.

## Technical approach

- Single Node script at `/tmp/build-glossary.ts` reads a TS object literal (the canonical source baked into the script) and emits all 6 output files.
- Run with `bun /tmp/build-glossary.ts`, then `zip` the output folder.
- No app code is touched. Nothing ships to users. Purely an artifact in `/mnt/documents/`.

## Deliverable

A single `<presentation-artifact>` tag pointing at `ledge-plain-language-glossary.zip` so you can download it and hand it to Claude / the writing team / field testers in one click.

## Out of scope (intentionally)

- Actually changing any UI strings in the app (that's the 9 follow-up PRs from the audit).
- Re-litigating term choices (Dealer vs Distributor, Godown vs Warehouse). Open questions stay open and are flagged in `README.md` so the brainstorm picks them up.
- Localisation / Hinglish variants. English-only for now; the JSON schema leaves room for an `hi`/`ml` column later.
