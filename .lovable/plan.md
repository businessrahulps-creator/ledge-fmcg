## Scope

Three surgical security fixes. No refactors, no logic changes outside the listed line ranges.

---

### TASK 1 — SEED_SECRET guard on seed functions

**`supabase/functions/seed-demo-account/index.ts`** — insert a guard block immediately after the OPTIONS handler (current lines 244–246) and BEFORE the existing super_admin auth code at line 248. New block (~7 lines) checks:

```
const SEED_SECRET = Deno.env.get("SEED_SECRET");
if (!SEED_SECRET || req.headers.get("Authorization") !== `Bearer ${SEED_SECRET}`) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 401,
  });
}
```

**`supabase/functions/seed-test-accounts/index.ts`** — same block, inserted between line 23 (close of OPTIONS branch) and line 25 (TEST_PASSWORD check).

**Behavioural note for your awareness (not a code change):** both files currently expect `Authorization: Bearer <user JWT>` and then verify the caller is a `super_admin`. After this change, `Authorization` must equal `Bearer ${SEED_SECRET}`, so the existing user-JWT path will always fail the new gate. That is the intended lockdown — these endpoints become operator-only, callable via curl with the secret header. If you want the existing super_admin self-serve path to keep working, say so and I will widen the guard to accept either the secret OR a super_admin JWT.

**Prerequisite:** a `SEED_SECRET` runtime secret must exist. It is not in `fetch_secrets` today. I will request it via `add_secret` at implementation time.

---

### TASK 2 — Restrict CORS origin

In all 5 files under `supabase/functions/`, replace the single line:

```
"Access-Control-Allow-Origin": "*",
```

with:

```
"Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
```

Files & exact line:
- `aging-check/index.ts` — line 6
- `dashboard-digest/index.ts` — line 7
- `explain-metric/index.ts` — line 7
- `seed-demo-account/index.ts` — line 4
- `seed-test-accounts/index.ts` — line 4

Default falls back to `*` so nothing breaks until `ALLOWED_ORIGIN` is set (e.g. `https://getledge.in`). I will request `ALLOWED_ORIGIN` via `add_secret` at implementation time.

---

### TASK 3 — Strict logo upload validation in `src/pages/Company.tsx`

Replace the current loose checks at lines 113–120:

```
if (file.size > 2 * 1024 * 1024) { ... }
if (!file.type.startsWith("image/")) { ... }
```

with a strict allowlist + 2MB cap:

```
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
if (!ALLOWED.includes(file.type)) {
  toast.error("Unsupported file type", { description: "Use JPG, PNG or WebP." });
  return;
}
if (file.size > 2 * 1024 * 1024) {
  toast.error("File too large", { description: "Logo must be under 2 MB." });
  return;
}
```

No other change to `handleLogoUpload` or `handleRemoveLogo`. No new imports (`toast` from `sonner` already in scope).

---

### Files & line ranges that will change

| File | Lines touched |
|------|---------------|
| `supabase/functions/seed-demo-account/index.ts` | 4 (CORS), insert ~7 new lines after 246 |
| `supabase/functions/seed-test-accounts/index.ts` | 4 (CORS), insert ~7 new lines after 23 |
| `supabase/functions/aging-check/index.ts` | 6 (CORS) |
| `supabase/functions/dashboard-digest/index.ts` | 7 (CORS) |
| `supabase/functions/explain-metric/index.ts` | 7 (CORS) |
| `src/pages/Company.tsx` | 113–120 (replace) |

Final line ranges in the post-change report will reflect the new line numbers after the seed-function inserts.

---

### Out of scope (explicit)

- No changes to function logic past the SEED_SECRET gate
- No CORS `Access-Control-Allow-Headers` changes
- No other Company.tsx edits, no other edge functions, no DB migrations
- No removal of the existing super_admin user-JWT branch in seed functions (see note above — call out if you want it kept working)

### Secrets required before deploy

- `SEED_SECRET` — random 32-byte string (I'll prompt via `add_secret`)
- `ALLOWED_ORIGIN` — e.g. `https://getledge.in` (I'll prompt via `add_secret`; optional, falls back to `*`)
