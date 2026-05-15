# Find Bugs → Push to Linear (read-only, won't touch the app)

Goal: audit Ledge for real bugs without modifying a single line of source code, then file each finding as a Linear issue in a new **Ledge** workspace.

---

## Guardrail: zero-risk audit

Everything in this plan is **read-only on the codebase**. No file edits, no migrations, no deploys, no dependency changes. The only writes happen in Linear (creating issues). If you don't like a finding, you delete the ticket — the app is untouched.

---

## Step 1 — Connect Linear

I'll trigger the Linear connector. You click once to authorize. This gives me API access to create issues, labels, and (if needed) the team.

## Step 2 — Set up the "Ledge" destination in Linear

Quick clarification on Linear's model:
- **Workspace** = your whole Linear account (already exists)
- **Team** = a top-level container with its own issue prefix (e.g. `LED-1`, `LED-2`). This is what most people mean by "create a new one for Ledge."
- **Project** = a body of work inside a team (e.g. "V1 Launch", "Bug Bash")

I'll do this:
1. Check if a team named **Ledge** already exists in your workspace
2. If not, create one with key `LED` via the Linear API (`teamCreate` mutation)
3. Create a project inside it called **Bug Bash — Initial Audit** so all the tickets from this pass are grouped and easy to triage/close in bulk
4. Create labels: `bug`, `severity:critical`, `severity:high`, `severity:medium`, `severity:low`, `area:orders`, `area:billing`, `area:stock`, `area:auth`, `area:ui`, `area:perf`, `area:a11y`, `area:security`

If the API can't create a team for permissions reasons, I'll stop and ask you to create it in Linear UI, then resume.

---

## Step 3 — The audit (read-only, 4 passes)

I run all four in parallel/sequence, collect findings, **show them to you for approval before pushing anything to Linear**.

### Pass A — Static code audit
- TypeScript: `tsc --noEmit` → list every type error
- ESLint: full repo lint → list errors and warnings
- Custom Ledge convention scan:
  - Raw `supabase` calls in pages (should use `useApi()`)
  - Raw `<input type="number">` (should use `<NumberInput>`)
  - Hex colors / non-semantic Tailwind colors in components
  - Pricing math outside `src/lib/order-pricing.ts`
  - Missing `key` props, missing `aria-*`, missing alt text
  - Unhandled promise rejections, `await` inside `.map`, missing `try/catch` around Supabase calls
  - Stale `useEffect` deps, missing cleanup functions

### Pass B — Test suite
- Run `bunx vitest run` (already passing — 114/114, will recheck)
- Run `bunx playwright test` if it executes in this sandbox; otherwise note it as a finding for you to run locally

### Pass C — Runtime smoke test (browser tool)
Click through the published URL on a fresh session:
1. Login → Dashboard
2. New Order → add lines → save (watch celebration)
3. Edit Order → change qty → save
4. Stock page → add product, add warehouse
5. Dealers → create dealer → open detail
6. Reports → each tab
7. Billing → create invoice
8. Settings → company info
9. Sign out

For each step I capture: console errors, failed network requests, broken layouts at mobile width (375px) and desktop (1280px). Each becomes a finding.

### Pass D — Backend security scan
- Run `supabase--linter` (RLS, policies, function search_path)
- Run `security--run_security_scan` (full Lovable security check)
- Check for tables without RLS, overly permissive policies, leaked anon-readable PII

---

## Step 4 — Triage & approval

I produce one consolidated table:

| # | Title | Area | Severity | Where | Suggested fix | File ticket? |
|---|-------|------|----------|-------|---------------|---|
| 1 | Stock value rounds incorrectly for >9999 units | stock | High | src/utils/formatCurrency.ts:42 | … | yes/no |

You reply with which rows to file (or "all"). Default is "file everything except `low` unless you say otherwise."

---

## Step 5 — Push to Linear

For each approved finding, I call Linear's `issueCreate` GraphQL mutation via the connector gateway with:

- **Title** — short, action-oriented ("Fix stock value rounding for high quantities")
- **Description** — markdown body with: symptom, repro steps, file:line refs, suggested approach, screenshots if from runtime pass
- **Team** — Ledge
- **Project** — Bug Bash — Initial Audit
- **Labels** — `bug`, `severity:*`, `area:*`
- **Priority** — Urgent (critical) / High / Medium / Low based on severity
- **Estimate** — rough t-shirt (1/2/3/5)

I'll batch them with a small delay to respect rate limits and report back: *"Filed 27 issues. 3 critical, 8 high, 14 medium, 2 low. View in Linear: <link>."*

---

## What I need from you to start

Approve this plan and I'll:
1. Trigger the Linear OAuth connection (one click from you)
2. Create the **Ledge** team + **Bug Bash** project + labels
3. Run all 4 audit passes
4. Show the triage table for your approval
5. File the approved tickets

Estimated time: ~5 minutes of audit + your triage time + ~1 minute to push tickets.

---

## What I will NOT do

- Edit any source files in this loop
- Run migrations or deploy anything
- Auto-fix bugs (that's the next loop, in Cursor or Lovable, ticket-by-ticket)
- File duplicate or speculative tickets without your approval
- Touch existing Linear teams/projects you already have
