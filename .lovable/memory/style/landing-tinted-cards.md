---
name: Landing tinted card system
description: Slowspace-inspired tinted-card primitives and per-section color rotation on the landing page
type: design
---
Four tinted-card variants in index.css: `.lp-card-tinted` base + `.lp-card-midnight | -forest | -terracotta | -bone`. Each variant carries the Ledge striped-mark watermark (`public/ledge-mark-watermark.png`) at top-right ~7% opacity, a radial vignette, soft warm shadow, and inverts inner `text-foreground/muted-foreground/lp-icon-tile` for dark variants.

Rule: ONE tinted card per landing section, rotating through the palette down the page. Current placements: Problem→Terracotta (Excel Nights), WhyLedge→Midnight (Offline-ready), Features→Forest+Terracotta bento (Dealer Intelligence + Returns), Outcome→Forest (Revenue recovered), Testimonials→Bone (Arnav featured), Pricing→Midnight (Scale) + Bone (Enterprise). Headings inside tinted cards auto-render in Playfair Display.

Hero, Navbar, Footer, TrustBar, HowItWorks, Founder, FinalCTA, LedgeIntelligence stay neutral to let the tinted cards pop.
