
# Ledge → Complete Hand-Off Bundle (Zero Comeback)

Our Ledge stays exactly as-is on Lovable Cloud. We ship them a self-contained clone they run on their own infra. The bar: they should never need to message us again — every question answered inside the zip.

## The "zero comeback" principle

Every doc must answer not just "how" but also "what is this", "why does it exist", "what breaks if I touch it", and "what do I do when X happens". We over-document on purpose. Three doc tiers:

1. **Runbooks** — copy-paste step-by-step (setup, deploy, restore)
2. **Reference** — what every table/function/secret/env var means
3. **Troubleshooting** — top 30 things that will go wrong + exact fix

## Deliverable: `ledge-handover.zip`

```
ledge-handover/
├── START-HERE.md                    ← single entry point, 10-min read
├── app/                             ← full source, ready to build
│   ├── .env.example
│   ├── README.md                    ← dev workflow, scripts, structure
│   ├── render.yaml                  ← one-click Render deploy
│   ├── vercel.json + public/_redirects   ← SPA fallback for any host
│   └── (entire repo, Lovable-specific bits stripped)
├── supabase/
│   ├── migrations/                  ← every migration, ordered
│   ├── functions/                   ← all 5 edge functions
│   ├── seed.sql                     ← role_capabilities_default + enums
│   ├── schema-dump.sql              ← pg_dump --schema-only (safety net)
│   ├── data-dump.sql                ← pg_dump --data-only (optional)
│   ├── cron-jobs.sql                ← pg_cron schedules to recreate
│   └── storage/company-logos/       ← every object from the bucket
├── docs/
│   ├── 00-architecture.md           ← system diagram, data flow, tech stack
│   ├── 01-supabase-setup.md         ← create project → migrations → seed → storage
│   ├── 02-edge-functions.md         ← what each does, deploy cmd, secrets
│   ├── 03-auth-setup.md             ← email + Google OAuth, redirect URLs, HIBP
│   ├── 04-hosting.md                ← Render (recommended) + Vercel/Netlify/AWS
│   ├── 05-custom-domain.md          ← DNS records, SSL, Supabase Site URL update
│   ├── 06-secrets-reference.md      ← every secret: what, where to get, who uses it
│   ├── 07-database-reference.md     ← every table, every column, every RLS policy explained
│   ├── 08-rbac-and-roles.md         ← roles, capabilities, how to grant/revoke
│   ├── 09-ai-features.md            ← Gemini setup, swap to OpenAI, disable AI
│   ├── 10-monitoring.md             ← error_log, Supabase logs, uptime checks
│   ├── 11-backups.md                ← pg_dump cron, storage backup, restore drill
│   ├── 12-glossary.md               ← every UI term in plain English (from prior bundle)
│   ├── 13-troubleshooting.md        ← top 30 issues + exact fixes
│   ├── 14-faq.md                    ← 50 questions they will ask
│   └── 15-handover-checklist.md     ← signed checklist they tick off as they go
├── audits/
│   ├── ledge-hardening-audit.md
│   ├── ledge-hardening-summary.md
│   └── ledge-plain-language-glossary.zip
└── scripts/
    ├── export-storage.sh            ← we run this once to populate storage/
    ├── verify-install.sh            ← they run this post-deploy to sanity-check
    └── rotate-secrets.sh            ← rotate Google OAuth, cron secret, etc.
```

## Code changes needed before we zip

These are the only edits to a copy of the repo (our live Ledge is untouched):

1. **AI edge functions** — rewrite `dashboard-digest`, `explain-metric`, any other Lovable-gateway call to hit Google AI Studio directly using `GEMINI_API_KEY`. (Free key from aistudio.google.com.)
2. **Strip Lovable bits** — remove `lovable-tagger` from `vite.config.ts` + `package.json`, delete `.lovable/`, remove edit-badge wiring.
3. **Generalise client** — confirm `src/integrations/supabase/client.ts` reads only from env vars (no hardcoded project ref fallback).
4. **SPA fallback files** — add `render.yaml`, `vercel.json`, `public/_redirects` so deep links work on every host.
5. **Verify script** — `scripts/verify-install.sh` curls the deployed URL, checks `/auth`, runs a SELECT against their Supabase via REST, prints PASS/FAIL.

## What each doc covers (so nothing comes back)

- **00-architecture** — React SPA + Supabase (Postgres + Auth + Storage + Edge Functions + pg_cron). Diagram. "If you change X, Y breaks."
- **01-supabase-setup** — exact CLI commands, expected output, screenshot of dashboard at each step.
- **06-secrets-reference** — every secret currently in our project, marked **REQUIRED / OPTIONAL / DEV-ONLY (skip)**. For each: what it does, where to get it, format, rotation steps.
- **07-database-reference** — auto-generated from live schema. All 28 tables, every column with type + purpose, every RLS policy translated to English ("Only members of the same company can read this row").
- **08-rbac-and-roles** — `super_admin`, `sales_manager`, `accountant`, `viewer`, capability matrix, how to promote/demote a user via SQL.
- **13-troubleshooting** — "Login redirects to localhost" → fix Site URL. "RLS error on insert" → check capability. "Cron job not firing" → check `cron_secret`. "AI feature returns 500" → check `GEMINI_API_KEY`. 30 entries minimum.
- **14-faq** — "Can we change the logo?", "How do we add a new role?", "Can we white-label?", "How do we export all data?", "What's the monthly cost?", "Can we self-host Supabase?", etc.
- **15-handover-checklist** — printable list. They tick: Supabase created ✓, migrations run ✓, storage restored ✓, auth configured ✓, edge functions deployed ✓, cron jobs created ✓, app deployed ✓, custom domain live ✓, verify-install passes ✓, test order placed end-to-end ✓.

## Recommended target stack for them (in START-HERE.md)

- **Hosting**: Render static site (5-min setup, $0–7/mo, auto-deploys from their Git)
- **Backend**: their own Supabase project (Pro tier, ~$25/mo recommended for production)
- **AI**: Google AI Studio (Gemini free tier covers normal usage)
- **Domain**: their existing registrar → Render CNAME
- **Monitoring**: Supabase built-in dashboard + UptimeRobot (free) hitting their domain

Total monthly: ~$25–35 vs. our Lovable setup. We mention this explicitly so they don't ping us asking.

## Open questions before I build

1. **Data dump**: ship **schema-only + seed** (clean start, no customer data), or **include current production data**? Default = schema-only; safer + no PII handover concerns.
2. **AI features at handover**: rewrite to direct Gemini calls now so they work day-1, **or** ship them disabled with a "to enable, do X" doc? Default = rewrite now.
3. **Storage bucket**: ship our current `company-logos` contents or empty? Default = ship contents (small, gives them realistic state).
4. **Code repo format**: just zipped files, or initialised as a fresh git repo with one initial commit? Default = fresh git repo (easier for them to push to GitHub).

Answer those four and I'll generate the full bundle in one pass — every doc, every script, every dump — and hand back `ledge-handover.zip` ready to email.
