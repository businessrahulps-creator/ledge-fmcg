---
name: Brand placement PR-A (Terracotta promotion)
description: Terracotta is now the canonical "needs you" hue — aging 61-90, claims, active onboarding chapter
type: design
---
PR-A of the Brand Color Placement Plan shipped. Terracotta (`--warning` / `--accent`, both hsl(19 56% 40%)) is now the canonical hue for "this needs a human."

Canonical placements:
- **Aging buckets** (`src/lib/aging.ts` BUCKET_TONE): b0 muted, b31 soft warm hint only, **b61 strong Terracotta wash + left-bar + bold text** (the moment), b90 destructive. `leftBar` token added — render with `relative` wrapper.
- **Claims page header** (`src/pages/Claims.tsx`): 3px Terracotta left-bar on the title block. "Warm conversation, not error."
- **First-week active chapter** (`src/components/onboarding/ChapterCard.tsx`): 3px Terracotta left-bar via `before:` pseudo-element when `state==="active"`.

Rule: Don't use Terracotta as decoration. Only promote it when the meaning is "this needs you to act." For pure danger use destructive; for success use Forest.
