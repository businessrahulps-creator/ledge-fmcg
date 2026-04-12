

# Add "Last Updated" Timestamp on Dashboard

## Change

Add a subtle "Last updated X ago" timestamp below the greeting header, showing when data was last refreshed. Clicking it triggers a manual refresh.

**Current**: Greeting + date only
**New**: Greeting + date + "Updated 2 min ago · Refresh" line

## Implementation

**`src/pages/Dashboard.tsx`** — single file, ~15 lines added:

1. Track a `lastUpdated` state initialized to `new Date()`, refreshed whenever `api.refreshAll` completes or `api.loading` transitions from true to false
2. Use a 1-minute interval to re-render the relative time string ("just now", "1 min ago", "5 min ago", etc.)
3. Render below the greeting (line ~110), styled as a tiny muted line:
   ```tsx
   <p className="text-[10px] text-muted-foreground/50 mt-1 flex items-center gap-1.5">
     Updated {timeAgo} 
     <button onClick={api.refreshAll} className="underline hover:text-foreground">
       Refresh
     </button>
   </p>
   ```

**1 file modified. No new dependencies. No database changes.**

