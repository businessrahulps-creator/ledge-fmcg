# Run the 36-point security audit on Ledge

## Is it worth it?

Yes. It's a good, standard checklist, and it's read-only, so it's safe to run. About two-thirds of it overlaps with tests we've already done: other businesses' data, roles, double taps, harmful text in exports, money rules on the server. Those should come back PASS quickly, with proof attached.

Its value is in the parts we haven't checked yet:
- **Rate limits** on login, signup, password reset and AI features (item 28)
- **Leaked-password protection** (item 24/04). I can now switch it on for you directly.
- **Content Security Policy** for harmful script on pages (item 19)
- **Source maps** that expose internal code in the live app (item 36)
- **Error messages** that leak internal details (item 12)
- **Edge functions**: CORS, input checks and sign-in checks on each one (items 16, 27, 34)
- **Logs and the error log**: no tokens or personal data stored (item 35)
- **Test sign-in files**: make sure the screen-test session files never reach the code store (items 11, 13)

## What I'll do

1. Go through all 36 items against the code, database rules and live settings. Each one gets PASS, FAIL, UNKNOWN or N/A, with the exact file or setting as proof. Nothing is marked PASS without evidence.
2. Fix the small, safe FAILs straight away: switch on leaked-password protection, tighten any loose function checks, hide internal error details, turn off source maps if they're exposed. Re-check each one after fixing.
3. List anything bigger for your decision instead of changing it quietly. For example, custom rate limits need their own setup.
4. Run the 380 automatic checks again, plus a quick screen test, to make sure nothing broke.

## What you'll get

A plain-words scorecard of all 36 items, what was fixed, and what still needs a decision. It will be saved to your Files so you can share it.

## Technical details

- Sources: `src/`, `supabase/functions/*`, `drizzle/migrations/*`, RLS and grants through read-only SQL, the existing security scan results, the built `dist/` for source maps, and `vite.config.ts`.
- Auth settings are changed with the auth configuration tool (HIBP). No production data is changed.
- The report is saved to `/mnt/documents/ledge-security-audit.md`.
