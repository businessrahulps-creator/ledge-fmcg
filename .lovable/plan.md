## Goal

Add a single `scripts/setup.sh` (plus a Node fallback `scripts/setup.mjs`) to the handover bundle that takes the recipient from a fresh clone to a fully provisioned backend in **one command**:

```bash
./scripts/setup.sh
```

It should restore the database schema, apply all migrations, create storage buckets, seed the cron secret, deploy edge functions, and write the project `.env` — idempotently, so re-runs are safe.

## What the script does (in order)

1. **Preflight**
   - Verify `node >= 22`, `bun`, `supabase` CLI, `psql` (optional, only needed for raw restore) and `git` are on PATH. Fail with a clear install hint if missing.
   - Load `.env.setup` if present (see below); otherwise prompt interactively for: `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, `CRON_SECRET` (auto-generate if blank), `ALLOWED_ORIGIN`.
   - Confirm target ref with the user before any destructive step.

2. **Link the Supabase project**
   - `supabase login --token "$SUPABASE_ACCESS_TOKEN"` (no-op if already logged in).
   - `supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"`.

3. **Restore / apply schema**
   - If `supabase/seed/schema.sql` exists (full pg_dump snapshot we ship in the bundle), run it first via `psql "$SUPABASE_DB_URL" -f supabase/seed/schema.sql` for a clean baseline.
   - Then `supabase db push` to apply every file under `supabase/migrations/` (idempotent — already-applied migrations are skipped).
   - Run `supabase db lint` and surface any warnings.

4. **Storage buckets**
   - Apply `supabase/seed/storage.sql` which `INSERT … ON CONFLICT DO NOTHING` for each bucket the app needs (currently `company-logos`, public) plus the RLS policies. Generated once from the live project; kept in source.

5. **Secrets & cron**
   - Push runtime secrets via `supabase secrets set` from `.env.setup`: `CRON_SECRET`, `ALLOWED_ORIGIN`, `LOVABLE_API_KEY` (optional), `DEMO_ACCOUNT_PASSWORD` / `TEST_ACCOUNT_PASSWORD` (optional).
   - Insert the cron secret into Vault via a small SQL helper so `public.get_cron_secret()` works.

6. **Edge functions**
   - `supabase functions deploy aging-check dashboard-digest explain-metric seed-demo-account seed-test-accounts --no-verify-jwt` (per-function `verify_jwt` is honoured from `supabase/config.toml`).

7. **Frontend wiring**
   - Write `.env` at project root with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` derived from the linked project (fetched via `supabase projects api-keys`).
   - `bun install`.
   - `bun run build` as a smoke test.

8. **Post-setup report**
   - Print a checklist: project ref, anon key fingerprint, bucket count, function count, migration count applied, next manual steps (configure Google OAuth in dashboard, set custom domain, enable email confirmations).

## Files added to the bundle

```text
app/
  scripts/
    setup.sh              # main entrypoint (bash, ~250 lines)
    setup.mjs             # Node fallback for Windows users
    lib/
      preflight.sh        # version checks
      prompt.sh           # interactive prompt helpers
      supabase.sh         # wrappers around supabase CLI
  supabase/
    seed/
      schema.sql          # full pg_dump of public schema (generated)
      storage.sql         # bucket + policy seed
      vault.sql           # cron_secret insert template
  .env.setup.example      # commented template the recipient copies to .env.setup
```

## Idempotency & safety rules

- Every SQL seed uses `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`.
- Migrations are applied via `supabase db push`, which tracks applied versions in `supabase_migrations.schema_migrations` — re-runs skip already-applied files.
- The script refuses to run against a project whose ref doesn't match `.env.setup` unless `--force` is passed.
- Destructive steps (schema restore) are gated behind an explicit `--with-schema-restore` flag; default re-runs only do migrations + secrets + functions.
- All output is colourised, each step is `[1/8] …` prefixed, failures abort with the exact command to retry.

## Docs updates

- Replace step 3–6 of `HANDOVER.md` with a single line: `./scripts/setup.sh`.
- Add a **Setup script** section to `README.md` documenting flags (`--with-schema-restore`, `--skip-functions`, `--force`, `--non-interactive`).
- Add a short troubleshooting block (CLI not installed, wrong ref, DB password rejected, function deploy timeout).

## Out of scope

- No auto-deploy to hosting (Vercel/Netlify) — recipient still wires that manually, per the earlier decision.
- No automatic Google OAuth setup — requires dashboard action.
- No data seed — the recipient starts with an empty workspace by design.

## After approval

I'll rebuild `ledge-handover.zip` with these files included, regenerate `schema.sql` / `storage.sql` from the current live project, and update `HANDOVER-RUNBOOK.md` so Phase 1 instructions point at the new script.