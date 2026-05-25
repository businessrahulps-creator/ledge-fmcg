# Handover via Your Existing GitHub Repo — Clean Swap Approach

Smart move. We use the GitHub repo Lovable already syncs to as the handover vehicle. You hand it over, then cut yourself free and re-bind a fresh repo to Lovable for our Ledge. Zero data loss on our side, zero questions from them.

## The swap, in order

### Phase 1 — Prep the repo for handover (while it's still yours, still synced to Lovable)

We push the handover scaffolding (already staged in `/tmp/handover/`) **as a new branch** called `handover/v1` on your existing repo. This way:
- Your `main` keeps tracking Lovable as usual — no disruption to our Ledge.
- The handover branch carries the cleaned source, docs, CI, scripts, etc.
- When ready, we merge `handover/v1` into `main` (or rename it to `main`) in one shot, right before the transfer.

What gets added on top of what's already in `/tmp/handover/`:
- `README.md` (repo-grade, with quickstart + screenshot + badges)
- `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`
- `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`
- `.github/ISSUE_TEMPLATE/`, `PULL_REQUEST_TEMPLATE.md`, `dependabot.yml`
- `.github/workflows/ci.yml` (lint + typecheck + vitest + playwright smoke)
- `.github/workflows/codeql.yml` (free SAST)
- `.github/workflows/deploy.yml` (optional Render/Vercel auto-deploy)
- Tag `v1.0.0` + GitHub Release with `ledge-handover.zip` attached as the offline copy
- Branch protection on `main`: require PR + CI green, no force-push, linear history

### Phase 2 — Disconnect Lovable from your repo

In Lovable: project settings → GitHub → **Disconnect**. This stops the auto-sync. Our live Ledge inside Lovable Cloud is **untouched** — code, database, storage, edge functions, secrets all stay put. Only the GitHub mirror stops updating.

### Phase 3 — Hand the repo over

Two options, pick one (open question below):

- **A. GitHub repo transfer** — you transfer ownership to their GitHub user/org via Settings → Transfer ownership. Preserves history, issues, Actions, releases. Cleanest. Requires their GitHub handle at transfer time.
- **B. Push-to-their-repo** — they create an empty repo on their side, you push your repo's contents there (`git push --mirror`). Slightly less clean (no automated Actions secrets carry-over), but you don't need anything from them upfront and can do it any time.

Recommendation: **A**. Only thing you need from them: their GitHub username/org, once.

### Phase 4 — Wipe and reset your side

After they confirm receipt:
1. Delete the repo from your GitHub account (Settings → Delete this repository).
2. (Optional, only if you want a totally fresh GitHub identity) create a new GitHub account.
3. In Lovable: project settings → GitHub → **Connect** → create a brand-new repo (e.g. `ledge`) under your account.
4. Lovable pushes our current Ledge codebase to the new repo as the initial commit. Done.

End state: they have a self-contained repo with everything. You have a fresh GitHub repo synced to the same live Lovable Ledge. No shared history, no shared anything.

## Why this is better than the zip-only approach

- They get **history, issues, PRs, Actions, Dependabot, CodeQL, Releases** — not just files.
- One-click clone, fork, deploy.
- The zip still rides along as a Release asset, so they have an offline backup inside the repo itself.
- Branch protection + CI templates mean their first contributor PR is sane from day one.

## What stays untouched on our side

- Our Ledge in Lovable Cloud (Supabase project, data, edge functions, secrets, auth config) — all of it.
- The `getledge.in` custom domain and Lovable publish — all of it.
- All `.lovable/memory/` files (we re-sync them when we connect the fresh repo).

## Open questions

1. **Transfer method** — GitHub repo transfer (need their GH handle) or push-mirror to their empty repo (need nothing)?
2. **License** — MIT, Apache 2.0, or "All rights reserved" proprietary?
3. **CI/CD on the handover repo** — wire up auto-deploy to Render/Vercel on push to `main`, or leave deploys manual?
4. **Auto-apply Supabase migrations** via Actions on merge to `main`, or manual `supabase db push`?

Answer those four and I'll execute Phase 1: build the full scaffolding on top of `/tmp/handover/`, commit it cleanly as `handover/v1` branch, ready for you to push and hand over.
