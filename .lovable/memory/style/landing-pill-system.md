---
name: Landing pill system
description: lp-pill, lp-pill-metric, lp-insight primitives + rationing rule (one pill cluster per section)
type: design
---
Pill vocabulary for landing page, inspired by iOS/Slowspace/Ticketapp references.

Primitives in src/index.css:
- `.lp-pill` (base capsule, layered soft shadow, no harsh border)
- `.lp-pill--success | --info | --warn | --neutral` — tinted tile + matching text
- `.lp-pill--on-dark` — white/10 surface for use inside Midnight tinted cards
- `.lp-pill-metric` — icon tile · label · value · delta chip
- `.lp-insight` (+ `--on-dark`) — "Coach insight" tinted micro-panel with header/body/link
- `.num-tabular` — tabular figures utility

Rationing rule: at most ONE pill cluster per section. Pills are accents, not wallpaper.

Current applications:
- Hero: 3 trust pills (Offline-ready / GST-ready / Built in Kerala) replace the text strip
- Problem: warn pill ("11:47 PM · Sunday") on Excel Nights terracotta card
- WhyLedge: lp-insight ("Field signal") on Midnight offline-ready card
- Outcome: lp-pill-metric (₹14.2L · ↑18%) on Forest revenue card
- Features: Dealer Intelligence card shows 3-row dealer roster; Returns & Claims card shows 3-step status timeline + amount

Type rule: pills always use Inter (never Playfair). Numbers always use num-tabular.
