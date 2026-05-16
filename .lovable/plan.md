## Navigation cleanup

### 1. Remove version chip in sidebar footer
`AppSidebar.tsx` — drop the "App version — open Settings" button (around line 266) and the `PRETTY_VERSION` / `SHORT_VERSION` import. Footer keeps only the user/profile row, giving the Insights group more breathing room and fewer competing elements.

### 2. Remove Help and Errors from navigation
- `AppSidebar.tsx`: remove `Help` from `footerNav` (line 72) and the admin-only `Errors` injection (line 94). Drop now-unused `BookOpen` / `AlertTriangle` icon imports.
- `AppLayout.tsx`: remove `Help` from mobile `moreGroups` (line 74). The /help and /admin/errors routes stay registered in the router — only the nav entries disappear, so the features remain reachable by URL and from Settings.

### 3. Move Activity to the top bar (yes, good call)
Activity is a transient, cross-cutting log — it behaves more like Notifications than a destination page, so it belongs next to the bell, not in a primary nav group. Plan:

- **Desktop**: Add an `Activity` icon-button (`History` icon) in the header's right cluster in `AppLayout.tsx`, sitting just left of `NotificationCenter`. Clicking opens the existing `ActivityLog` drawer (lift the `activityOpen` state that already lives in `AppLayout`). Tooltip "Recent activity".
- **Sidebar Insights group** shrinks to just `Reports`. Since that's now a single item, collapse the "Insights" group label and render Reports as a top-level item under Catalog/Relationships — or keep the label for structure. Recommend: **keep the label** for now to preserve the four-section rhythm; we can fold it later if it feels thin.
- **Mobile**: Remove the Activity tile from the Menu sheet's Insights row. Add the same Activity icon-button to the mobile header (between PageTitle area and NotificationCenter). Same drawer.
- The mobile bottom-bar "Insights" tab keeps pointing at Reports (rename label to "Reports" for clarity, icon stays `BarChart3`).

### 4. Cleanup
- Remove `History` import from `AppSidebar.tsx` if no longer used there; add it to `AppLayout.tsx` if not already imported.
- Remove `Activity` from `ROUTE_TITLES` mapping in `AppLayout.tsx` (it's not a real route).
- No router or feature deletion. No backend changes.

### Files touched
- `src/components/layout/AppSidebar.tsx`
- `src/components/layout/AppLayout.tsx`

### Why this works
Top bar already hosts ephemeral, global affordances (Search, Notifications, Refresh, Install). Activity is the same shape: it's a log you peek at, not a page you navigate to. Moving it there reduces sidebar noise, frees a row in Insights, and makes the action discoverable from every screen without a click into the sidebar.