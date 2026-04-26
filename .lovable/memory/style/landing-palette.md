---
name: Landing palette (cool)
description: Landing page uses a cool Navy/Purple/Electric Blue palette — distinct from the warm in-app shell. No coral on landing.
type: design
---
The **landing page only** uses the cool Ledge palette:

- BG: White `#FFFFFF` and Light Gray `#F5F6F8` alternating; dark sections use Primary Navy `#0A0F1C`
- Text: Headings `#0A0F1C`, body `#1F2937`, muted `#64748B`, light-on-dark `white/70`
- Borders: `#E5E7EB`
- Primary CTA: Navy `#0A0F1C` (white CTA on dark sections)
- Accents: Gradient Purple `#7C3AED` and Electric Blue `#2563EB`
- Success ticks (pricing): Teal `#06B6A4`
- Landing brand gradient (coral-free): `linear-gradient(90deg, #7C3AED 0%, #6C5CE7 50%, #2563EB 100%)`
- Utilities: `.brand-gradient-cool-text`, `.brand-gradient-cool-bg`, `.brand-gradient-cool-soft-bg` in src/index.css

**Why:** User explicitly requested no coral on the landing page and a Navy/Violet/Electric Blue identity from the official Ledge palette image.

**How to apply:** Use the `brand-gradient-cool-*` utilities for landing eyebrows/numbers/dividers. Never apply these to in-app screens — the warm in-app shell and the 4 in-app brand moments (splash, empty state, NewOrder celebration, sidebar logo) keep the original Purple→Coral gradient. The two systems are intentionally separate.
