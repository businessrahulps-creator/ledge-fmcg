

## Remove System Health from customer Settings

### Changes
1. **`src/pages/Settings.tsx`** — remove the System Health section + the `SystemHealthCard` import + the `userRole === 'super_admin'` conditional render block.
2. **`src/components/settings/SystemHealthCard.tsx`** — delete the file (no other consumers; confirmed by search).

### Keep (do NOT remove)
- `error_log` table + RLS — keep collecting errors silently. Useful for you via direct DB queries today, and ready to power a real internal admin dashboard later.
- `src/utils/errorLog.ts` — all the `logError(...)` call sites stay. Failures keep landing in the table.
- Global handlers in `main.tsx` — unchanged.

### Out of scope (future, separate project)
- Internal operator dashboard with `platform_admin` role on a dedicated table
- Cross-tenant error aggregation, trend charts, alerting

### Why this is right
- Zero loss of observability — you still see everything via the DB.
- Zero customer-facing surface area for internal tooling.
- Clean separation: tenant `super_admin` ≠ platform operator. When you build the internal dashboard, it'll use a different gating mechanism from day one.

