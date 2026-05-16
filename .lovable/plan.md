
## What's happening on getledge.in

I loaded https://getledge.in in a real browser. The site is blank because of a hard JavaScript error during boot:

```
Uncaught ReferenceError: Cannot access 'S' before initialization
  at https://getledge.in/assets/charts-DTlgJYNp.js:9:16763
```

Plus a secondary, non-fatal:
```
GET /manifest.json?v=3 → 404
```

(The `apple-mobile-web-app-capable` warning is cosmetic, ignore.)

The TDZ error nukes the whole React tree before it can render → `<div id="root"></div>` stays empty → bone-coloured blank screen.

## Why this is happening

This is the classic Vite/Rollup `manualChunks` Temporal Dead Zone bug. In `vite.config.ts` we split vendor code into many named chunks:

```ts
if (id.includes("/recharts/") || id.includes("/d3-")) return "charts";
if (id.includes("/@radix-ui/")) return "radix-vendor";
if (id.includes("/@supabase/") || id.includes("/@tanstack/")) return "supabase-vendor";
if (id.includes("/recharts/") || id.includes("/d3-")) return "charts";
...
```

`recharts` and the `d3-*` constellation depend on each other and on shared utilities. When the splitter puts them in different chunks (or splits internal d3 helpers across chunks), the load order becomes non-deterministic. One chunk dereferences an exported binding from another chunk that hasn't run its module init yet → `ReferenceError: Cannot access 'X' before initialization`.

Two important notes:
1. **This bug is in the published build only** (timestamp `1778910002833`), because that's when these chunks were last produced. We haven't republished since.
2. **The current source already has the offline-mode fixes from the last turn**, which includes the new static `public/manifest.json`. That will resolve the 404 the moment we publish — but only after we also fix the TDZ bug, otherwise we'd re-publish another broken build.

## The fix

### 1. Stop splitting `charts` (the actual TDZ culprit)

Remove the `recharts`/`d3-*` rule from `manualChunks` in `vite.config.ts`. Let recharts + its d3 deps land in the default Rollup-decided vendor chunk where the bundler can keep their dependency graph intact.

That's a one-line removal:

```ts
// DELETE this line:
if (id.includes("/recharts/") || id.includes("/d3-")) return "charts";
```

We keep the safer splits (`react-vendor`, `radix-vendor`, `supabase-vendor`, `icons`, `motion`, `xlsx`, `date-fns`) — none of those have inter-chunk init dependencies the same way recharts ↔ d3 does.

Bundle-size impact: recharts is ~150 KB gzipped; lazy-loaded routes that don't import it won't pay the cost because Rollup will keep it in a route-level chunk by default. We won't lose meaningful caching.

### 2. Confirm `public/manifest.json` exists (it does)

Last turn I added `public/manifest.json` so the `<link rel="manifest" href="/manifest.json?v=3">` in `index.html` stops 404'ing. Nothing else to do here — just need to publish.

### 3. Re-publish

The frontend update only goes live after the user clicks **Publish → Update** in the Lovable publish dialog. I'll surface that action at the end of the chat.

## What I am NOT changing

- The offline-mode pause work from the previous turn stays exactly as-is (kill-switch `sw.js`, flag-gated offline store).
- No source-code changes outside `vite.config.ts`.
- No package upgrades. The TDZ is purely a chunking artifact, not a recharts bug.

## Files touched

**Edited (one line removed):**
- `vite.config.ts`

**Not touched:**
- everything else

## Risk

Very low. We're removing a chunk-split rule, not changing app code. The worst case is one slightly larger vendor chunk on routes that use recharts (Dashboard, Reports, Performance). In return we get the published site loading at all.

After publish, I'll re-load getledge.in in the browser to confirm the blank screen is gone and console is clean.
