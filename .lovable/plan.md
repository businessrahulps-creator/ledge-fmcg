

The `SEED_ADMIN_TOKEN` is a password that protects the two seeding edge functions (`seed-demo-account`, `seed-test-accounts`) so random people on the internet can't trigger them and spam your database with fake accounts.

Looking at the situation again: these seeding functions are internal tools you only run manually during development. Since `<db-triggers>` shows no triggers exist (the previous trigger work didn't take effect), and the seed functions are now blocked by the token guard I already added in code, the safest move is:

## Plan — Final Phase 4 cleanup

1. **Re-apply the missing triggers** — `<db-triggers>` confirms `trg_refresh_aggregates_orders` and `trg_refresh_aggregates_order_lines` are NOT attached. The previous migration didn't stick. Re-run via a fresh migration so distributor outstanding / salesperson totals actually auto-update on order changes.

2. **Backfill aggregates once** — recalculate `distributors.total_value`, `distributors.outstanding_amount`, `distributors.total_orders`, `salespersons.total_value`, `salespersons.total_orders`, and `products.total_sold` so existing data matches the new net-revenue formula immediately.

3. **Lock down seed functions without needing a secret from you** — instead of using `SEED_ADMIN_TOKEN`, I'll change the guard to require a `super_admin` JWT from your own logged-in account. That way:
   - No secret for you to manage.
   - No one else can call them.
   - You can still trigger them yourself if needed.

4. **Verify** with a quick read query that triggers are attached and aggregates look sane.

## What you need to do
**Nothing.** No secrets to save, no settings to change. I'll handle it all in the next step once you approve.

## Out of scope
No new features, no UI changes, no auth provider changes.

