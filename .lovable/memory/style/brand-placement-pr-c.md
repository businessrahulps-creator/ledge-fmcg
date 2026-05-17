---
name: Brand placement PR-C (Midnight letterhead)
description: Midnight is now the canonical "record of truth" hue — PDF letterhead, detail page rule
type: design
---
PR-C of the Brand Color Placement Plan shipped. Midnight (`--primary`, #0F1F3A) signals authority and "this is the record."

Canonical placements:
- **PDF letterhead** (`src/components/pdf/PdfStyles.ts`): header bottom border bumped to 1.5pt Midnight (was 1pt #000). Table header background and totals divider also Midnight (was #374151 charcoal). One unified Ledge letterhead across invoice, statement, performance reports.
- **Detail page title rule** (`src/pages/DealerDetail.tsx`, `src/pages/OrderDetail.tsx`, `src/pages/SalespersonDetail.tsx`): 3px Midnight rule on the title block. "Record of truth" moment.

Rule: Midnight is for finality and identity. Never use it for hover states (depth tokens own those), never gradient it, never decorate with it. The PageHeader primitive does not yet have an `accent` prop — when we refactor detail pages onto it, lift the rule into a prop instead of inlining.
