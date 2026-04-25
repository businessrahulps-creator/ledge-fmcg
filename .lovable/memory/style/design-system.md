---
name: Design system tokens
description: Electric Blue primary, brand status colors, warm stone neutrals retained
type: design
---
Primary: Electric Blue `hsl(222, 84%, 56%)` light / `hsl(222, 75%, 65%)` dark — replaces former muted teal
Background: warm stone `hsl(40, 20%, 95%)` light / `hsl(30, 6%, 7%)` dark — UNCHANGED, do not shift to brand cool grays
Cards: warm white `hsl(40, 25%, 99%)` — subtle depth, not pure white
Borders: warm gray `hsl(35, 10%, 87%)` — barely visible, not cool/blue

Status semantics (brand-aligned):
- `--success`: Teal `#06B6A4` (`172 93% 37%` light / `172 70% 48%` dark)
- `--warning`: Amber `#FFA800` (`38 100% 50%`)
- `--destructive`: Coral Pink `#FF6B6B` (`0 100% 71%` light / `0 90% 68%` dark)

Brand moments (rationed — see mem://style/brand-moments):
- `--brand-purple`: `#7C3AED`
- `--brand-coral`: `#FF8A3D`
- `--brand-gradient`: 90deg purple → coral
- Utilities: `.brand-gradient-text`, `.brand-gradient-bg`, `.brand-gradient-soft-bg`

Inspired by Ledge brand palette + Cursor's calm, warm, enterprise aesthetic. Brand energy through accents and rare moments; calm through neutrals and typography.
