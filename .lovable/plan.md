

# Apple HIG-Guided UI/UX Refinement — Final Pass

## Audit Summary

After studying Apple's HIG principles (Hierarchy, Harmony, Consistency, Motion, Feedback) and reviewing every major screen, the app is already well-built with good spring animations, glassmorphic cards, and a clean hierarchy. However, several details fall short of Apple's standard of calm, effortless precision.

## Issues Found

### HIGH — Perception & Feel

**H1. Page transition feels abrupt — no spatial continuity**
The `AnimatePresence` page transition in `AppLayout.tsx` uses only `opacity` with `duration: 0.15`. Apple HIG emphasizes that transitions should provide spatial context. A subtle `y` offset (4px) combined with the existing spring system would create a gentle "settling" feel rather than a flat opacity swap.
- File: `src/components/layout/AppLayout.tsx:219-222`
- Fix: Add `y: 4` to initial state, use spring transition instead of duration

**H2. Pull-to-refresh spinner lacks spring physics**
The pull-to-refresh indicator in Dashboard/Orders uses CSS `rotate()` via inline style — no spring physics. Apple's pull-to-refresh uses fluid, physics-based resistance. The spinner rotation should use the motion system's spring presets.
- File: `src/pages/Dashboard.tsx:161-168`
- Fix: Already acceptable — the rotation maps linearly to pull distance which is correct iOS behavior. Skip.

**H3. Bottom nav `active:scale-90` is too aggressive**
Apple's tab bar items don't scale on press at all — they rely on color change for feedback. A 10% scale reduction feels jarring and un-Apple-like. Reduce to `active:scale-95` or remove entirely.
- File: `src/components/layout/AppLayout.tsx:244, 268`
- Fix: Change `active:scale-90` to `active:scale-[0.97]`

**H4. FAB shadow lacks depth layering**
The Dashboard FAB uses `shadow-lg` which is a single flat shadow. Apple's floating elements use layered shadows (a tight, dark shadow + a diffuse, lighter one) for realistic depth.
- File: `src/pages/Dashboard.tsx:470`
- Fix: Replace `shadow-lg` with `shadow-[0_2px_8px_rgba(0,0,0,0.15),0_6px_20px_rgba(0,0,0,0.1)]`

### MEDIUM — Consistency & Harmony

**M1. Inconsistent motion imports — inline springs vs motion.ts presets**
Dashboard, Orders, AppLayout all define inline `{ type: "spring", damping: 26, stiffness: 200 }` instead of importing `spring.default` from `motion.ts`. This creates drift risk and violates HIG's consistency principle.
- Fix: Replace inline spring configs with imports from `motion.ts` across Dashboard, AppLayout, and SetupChecklist. (Note: this is a refactor for maintainability — no visual change. Defer to a separate pass.)

**M2. "More" sheet drag handle needs larger touch target**
The drag handle in the bottom sheet (`w-10 h-1`) has no explicit touch target. Apple's sheet handles have a minimum 44pt touch area around them.
- File: `src/components/layout/AppLayout.tsx:291`
- Fix: Wrap in a `py-2` container for implicit 44px touch target (the div already has padding above, so this is fine as-is). Skip.

**M3. Onboarding emoji ("🎉", "👋") breaks premium tone**
Apple never uses emoji in system UI. The onboarding checklist uses "🎉" and the Help page uses "👋". These feel playful but not premium.
- Files: `src/components/onboarding/SetupChecklist.tsx:83`, `src/pages/Help.tsx:32`
- Fix: Remove emojis. The visual hierarchy (icons, typography) should do the work.

**M4. Section headers lack consistent vertical rhythm**
Dashboard sections use `mb-4` for section header spacing. But the `space-y-8` container already provides 32px gaps. The headers' `mb-4` creates uneven spacing between the header text and the card below vs. the gap above. Apple HIG demands precise vertical rhythm.
- Fix: This is actually correct — `mb-4` controls header-to-content distance while `space-y-8` controls section-to-section. No change needed.

### LOW — Tiny Details

**L1. "View all →" links use ASCII arrow instead of proper chevron**
Apple uses `›` (right-pointing single quotation mark) or an SF Symbol chevron, never `→`. The arrow looks utilitarian rather than elegant.
- Files: Dashboard.tsx lines 327, 355, 384
- Fix: Replace `→` with `›` for a cleaner feel.

**L2. Status badge dot size inconsistency**
`StatusBadge` uses `h-1.5 w-1.5` (6px) dots. Apple's status indicators typically use slightly larger 8px dots for better visibility.
- Fix: Keep as-is — the 6px dots work well at the small badge scale. Skip.

---

## Implementation Plan (4 passes, ~15 lines changed)

### Pass 1: Smoother page transitions (H1)
| File | Change |
|------|--------|
| `src/components/layout/AppLayout.tsx:219-222` | Add `y: 4` to initial, use spring transition |

### Pass 2: Softer bottom nav press feedback (H3)
| File | Change |
|------|--------|
| `src/components/layout/AppLayout.tsx:244` | `active:scale-90` → `active:scale-[0.97]` |
| `src/components/layout/AppLayout.tsx:268` | Same change |

### Pass 3: FAB layered shadow + remove emojis (H4, M3)
| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx:470` | Replace `shadow-lg` with layered shadow |
| `src/components/onboarding/SetupChecklist.tsx:83` | Remove "🎉" |
| `src/pages/Help.tsx:32` | Remove "👋" |

### Pass 4: Refined "View all" links (L1)
| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx:327,355,384` | Replace `→` with `›` |

Total: 4 files, ~12 lines of surgical changes. Zero new features. All existing behavior preserved.

