

## What's happening

**Issue 1 — raw timestamp looks unprofessional**
`__APP_VERSION__` is a Unix millisecond timestamp (`1776414083231`) injected at build time by `vite.config.ts`. It works as a unique identifier but reads like a database key, not a version.

**Issue 2 — "Released" date doesn't change after publish**
The "Released" date in `AboutSection.tsx` is just `formatBuildDate(version)` — i.e. it formats the **same** `__APP_VERSION__` constant. So Build and Released are literally the same number rendered two ways.

If Released is still showing the old time after you published, then the running JS bundle is still the old build — `__APP_VERSION__` is baked in at compile time and only changes when a fresh bundle loads. Two likely causes:

1. **You checked from inside the preview iframe / browser tab** that hadn't actually reloaded the new bundle yet. The "Check for updates" button calls `__ledgeTriggerUpdate`, which only reloads if it detects a new SW *or* a meta-tag mismatch. If neither fired (iOS throttling, or the SW already had the latest cached), no reload happened, so `__APP_VERSION__` is still the old constant.
2. **The page reloaded but Service Worker served stale `index.html`**, so the meta-tag check compared old-to-old. Less likely now that we switched to NetworkFirst, but possible.

So both issues are connected: the version string is ugly **and** there's no easy way to confirm visually whether you're actually on the new build.

## Fix — 3 small changes

**File: `src/components/settings/AboutSection.tsx`**

1. **Pretty version label**: Format `__APP_VERSION__` as `Ledge v26.4.17.1351` — derived from the build timestamp:
   - `v` + `YY.M.D.HHMM` (year.month.day.hour-minute, IST)
   - Example: timestamp `1776414083231` → `Ledge v26.4.17.1351`
   - Keep the raw timestamp shown smaller below as "Build ID" for debugging/support.

2. **Show both "Released" and "Running since"**:
   - **Released**: formatted build date (when this bundle was compiled) — same as today, but now clearly labeled.
   - **Running since**: `new Date()` captured on first mount — when *this tab* loaded the current bundle. Lets you visually confirm "yes, I just reloaded into a fresh build."

3. **Make "Check for updates" honest**: After the check runs, if no update was found, also show a tiny inline note: `Last checked: 2:15 pm` so you can tell the check actually happened (currently the only feedback is a toast that disappears).

**File: `src/components/UpdatePrompt.tsx`** (tiny tweak)
- When `__ledgeTriggerUpdate` finds no update via SW but the meta-version *matches*, return `false` as today — but also expose `window.__ledgeLastCheck = Date.now()` so AboutSection can read it.

## Why "Released" wasn't updating — the real diagnostic

After this change, you'll see:
- **Ledge v26.4.17.1351** (pretty version)
- **Released**: 17 Apr 2026, 01:51 pm
- **Running since**: 17 Apr 2026, 02:30 pm  ← if these two differ a lot, the build is old
- **Last checked**: 02:31 pm
- **Build ID**: 1776414083231

If after publishing + tapping "Check for updates" the **Released** time doesn't move forward, it means the new bundle hasn't been fetched yet — most likely the Lovable CDN hasn't propagated the publish, or iOS is still serving cached `index.html`. The visible "Last checked" timestamp will at least confirm the check ran.

## Files touched
- `src/components/settings/AboutSection.tsx` — formatting + new fields
- `src/components/UpdatePrompt.tsx` — expose `window.__ledgeLastCheck`

## What stays the same
- Build timestamp injection in `vite.config.ts`
- All 4 layers of update detection
- `RefreshAppButton` behavior

