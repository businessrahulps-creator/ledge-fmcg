**Root cause audit**

1. **Loaded data can be cleared during transient auth/profile gaps**
   - `src/context/DataContext.tsx:126-142`
   - The effect clears every data array whenever `authReady && !companyId` is true. If the profile/company id briefly drops during auth/profile refresh, already-rendered pages receive empty arrays, so KPI numbers and lists disappear, then return when `companyId` resolves again.

2. **Background refresh can publish partial page state**
   - `src/context/DataContext.tsx:204-227`
   - Phase 1 of `fetchAll` immediately replaces distributors/products/salespersons/schemes while phase 2 is still loading. On pages whose numbers combine phase-1 and phase-2 data, this can create a short inconsistent/empty-looking frame during background refresh.

3. **Fetch failures still end the refresh after partially-applied state**
   - `src/context/DataContext.tsx:301-310`
   - If phase 2 fails after phase 1 has already replaced data, the app keeps the partial state. The console shows repeated pagination/logging around `order_lines` and `order_schemes`, so this is the area most likely to amplify the flicker on all pages.

4. **There is a small duplicate return bug in phase 1**
   - `src/context/DataContext.tsx:230-234`
   - Not the main glitch, but it confirms the fetch block was edited recently and should be cleaned while touching the same file.

**Files to touch**

- `src/context/DataContext.tsx` only.

**Fix plan**

1. **Stop clearing data during profile/company transient states**
   - Change the clear-data effect so it only clears arrays when the user is truly signed out, not merely when `companyId` is temporarily null.
   - This directly prevents the dealer page and other pages from receiving empty arrays for one second.

2. **Make background refresh atomic**
   - For background fetches, collect phase 1 + phase 2 results first, then commit all state together after the full fetch succeeds.
   - Keep cold-start behavior as-is: first load can still show skeleton until data is ready.
   - This preserves the current UI while fresh data is loading, then swaps to the new snapshot in one render.

3. **Preserve last good data on fetch error**
   - If a background fetch fails, do not replace any existing data with partial results and do not flip the app into empty states.
   - Only offline cold-start should attempt cache fallback.

4. **Remove the unreachable duplicate return**
   - Delete the duplicate return in phase 1 while keeping behavior unchanged.

**Expected result**

- Navigating or waiting on `/distributors` should no longer cause dealers, KPI values, or page content to disappear and reappear.
- Background refreshes still happen, but the user keeps seeing the last stable snapshot until the next full snapshot is ready.