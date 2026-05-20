## What's happening

After login on `getledge.in/dashboard`, you hit the global error boundary ("Something went wrong"). The preview at `lovableproject.com/dashboard` loads fine, which tells us two things:

1. The crash is specific to the **published build** on `getledge.in` (it's running older code than the preview).
2. There's also a real backend bug visible in the console: the `dashboard-digest` edge function has its CORS allowlist set to `https://getledge.in/` (with a trailing slash). Browsers send `Origin: https://getledge.in` (no slash), so the request is blocked on production. Same function also fails for the lovableproject preview and `ledge-fmcg.lovable.app`.

The CORS failure alone shouldn't crash the page (the TodayDigest component catches it), so the production crash is almost certainly a stale bundle from before recent dashboard fixes. Republishing should clear it.

## Plan

### 1. Fix the `dashboard-digest` CORS handler

Replace the single-origin `ALLOWED_ORIGIN` env read with a small allowlist that echoes the request's `Origin` when it matches. Allowed origins:

- `https://getledge.in`
- `https://www.getledge.in`
- `https://ledge-fmcg.lovable.app`
- `https://*.lovableproject.com` (preview)
- `http://localhost:*` (dev)

Apply the resolved `Access-Control-Allow-Origin` to both the OPTIONS preflight and every JSON response. Add `Vary: Origin`.

### 2. Republish to push the latest dashboard code to getledge.in

After the function change, republish the app so `getledge.in` runs the same Dashboard bundle as the preview (which doesn't crash). I'll prompt you to publish.

### 3. Verify

- Open `getledge.in/dashboard` after publish → page loads, no error boundary.
- "Today's briefing" card loads its summary (or shows the inline retry, never a crash).
- If the dashboard still crashes after republishing, I'll add a tagged `console.error` capture in `PageErrorBoundary` so the exact stack appears in your next message and we can fix the underlying component.

### Technical details

- File: `supabase/functions/dashboard-digest/index.ts` — replace the constant `corsHeaders` with a `resolveCors(req)` helper and call it inside `Deno.serve`. No client-side code changes.
- No DB migration, no secret changes (the `ALLOWED_ORIGIN` secret becomes unused but can stay).
- Republish step is user-driven via the Publish button.
