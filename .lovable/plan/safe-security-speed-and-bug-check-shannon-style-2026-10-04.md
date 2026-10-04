# Safe security, speed and bug check (Shannon-style)

## Short answer
Shannon is a robot hacker: it reads your code, then really attacks a running copy of the site to prove each weakness. If it's pointed at a copy, it can't harm your live site, your real data or your code. It only reads the code; it never changes it.

It needs Docker and a paid AI key on your own computer, and you're new to this. So I'll do the same kind of attack myself, on a throwaway copy. You don't need to install anything.

## What I'll do

1. **Make a throwaway copy.** I'll make a separate draft with its own empty database. The live site (getledge.in), the preview and your real business data stay untouched.
2. **Fill it with fake data.** I'll create two fake businesses with fake dealers, products, orders, bills and payments. I'll also create one test person for each role: owner, manager, accountant, sales rep and viewer.
3. **Attack it like Shannon would, then check each find:**
   - Can someone see or change another business's data?
   - Can a viewer or sales rep do owner-only things, like change access, record money or see buying?
   - Can someone get in while signed out, or fake who they are?
   - Can someone save forged amounts, negative prices, change a GST bill or double a payment?
   - Can someone slip harmful text into names, CSV downloads, Tally files or search?
   - Run the automated safety scanners on the database and the app's add-ons.
   As with Shannon, a weakness only counts if I can actually make the attack work on the copy.
4. **Speed check:** time how fast pages open and how many requests each one makes, and find the slowest database lookups.
5. **Bug sweep:** run all 397+ existing checks, plus the Astra review of anything new I find.
6. **Fix what's real,** using the same safe rules as before: bills only change through credit notes, and every save is all-or-nothing. Then I'll re-attack the copy to prove each fix works. Fixes go live only after you review them and publish.
7. **Report** in plain words: what I found, what I fixed and what's still open.

## Optional later
If you ever want the real Shannon tool, I can write a one-page guide for running it against the throwaway copy. You don't need it for this check.

## Technical details
- Draft branch with an isolated backend (`drafts--create`); sessions come from `lovable auth-session` on that draft.
- Probes go straight to the REST and RPC endpoints using each role's token: cross-tenant reads and writes, capability bypass on the `*_atomic` RPCs, anon access to SECURITY DEFINER functions, grants on every public table, storage buckets, edge functions, and idempotency or race checks on money RPCs.
- Also: `security--run_security_scan`, `supabase--linter`, `security--dependency_scan`, `supabase--slow_queries`, and Playwright timings.
- Fixes go into new migrations plus client edits, verified on the draft, then accepted into main.
