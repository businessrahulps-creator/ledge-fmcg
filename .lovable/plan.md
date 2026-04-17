

## Plan

Surface the pretty version label in the `AppSidebar` footer.

### Approach
Extract the `formatPrettyVersion` logic so it can be reused, then render the resulting string in `AppSidebar.tsx`'s `SidebarFooter` — below the bottom nav items, above the safe area.

### Changes

**1. New file: `src/lib/app-version.ts`**
- Export `APP_VERSION` (raw build timestamp) and `PRETTY_VERSION` (formatted `Ledge vYY.M.D.HHMM` in IST).
- Move `formatPrettyVersion` here from `AboutSection.tsx` so both consumers share one source of truth.

**2. Edit `src/components/settings/AboutSection.tsx`**
- Replace local `formatPrettyVersion` and `__APP_VERSION__` reads with imports from `@/lib/app-version`.
- No visual change.

**3. Edit `src/components/layout/AppSidebar.tsx`**
- In `SidebarFooter`, after the `bottomNav` map, add a small footer label:
  - Expanded state: centered `text-[10px] text-muted-foreground/60 font-mono` showing `Ledge v26.4.17.1351`.
  - Collapsed state: show only the version number (`v26.4.17.1351`) — no "Ledge" prefix, even smaller text, so it fits in the narrow rail.
- Tappable: wrap in a `Link to="/settings"` so clicking it jumps to Settings → About section.

### Files touched
- `src/lib/app-version.ts` (new)
- `src/components/settings/AboutSection.tsx` (refactor only)
- `src/components/layout/AppSidebar.tsx` (add footer label)

### Stays the same
- All update-detection logic, About section content, sidebar nav items, collapse behavior.

