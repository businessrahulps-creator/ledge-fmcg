---
name: Design system tokens (V2 ground truth)
description: Live V2 token reference — Midnight/Forest/Terracotta/Bone, Playfair+Inter, 6px radius, Fluent depth/motion. Source: src/index.css
type: design
---
Single source of truth for V2 tokens. Pulled directly from `src/index.css`.
Anything that contradicts this file is wrong — fix the file or fix the code.

## Brand anchors (raw HSL)

| Name        | HSL                | Hex       | Role                       |
| ----------- | ------------------ | --------- | -------------------------- |
| Midnight    | `218 60% 14%`      | `#0F1F3A` | Primary, focus ring, ink   |
| Forest      | `165 50% 11%`      | `#0E2A22` | Success base               |
| Terracotta  | `19 56% 40%`       | `#A0522D` | Accent, warning            |
| Bone        | `34 47% 93%`       | `#F5EFE6` | App background             |

## Semantic tokens (light mode — the only one shipping)

| Token                  | HSL                | Notes                                  |
| ---------------------- | ------------------ | -------------------------------------- |
| `--background`         | `34 47% 93%`       | Bone                                   |
| `--foreground`         | `220 22% 8%`       | Near-black, slight cool                |
| `--card`               | `0 0% 100%`        | Pure white card on Bone                |
| `--card-foreground`    | `220 22% 8%`       |                                        |
| `--popover` / fg       | `0 0% 100%` / same |                                        |
| `--primary`            | `218 60% 14%`      | Midnight                               |
| `--primary-foreground` | `34 47% 96%`       |                                        |
| `--secondary`          | `34 25% 88%`       | Warm bone tint                         |
| `--muted`              | `34 20% 90%`       |                                        |
| `--muted-foreground`   | `220 10% 38%`      |                                        |
| `--accent`             | `19 56% 40%`       | Terracotta                             |
| `--accent-foreground`  | `0 0% 100%`        |                                        |
| `--success`            | `165 50% 22%`      | Forest, lifted for legibility          |
| `--success-foreground` | `0 0% 100%`        |                                        |
| `--warning`            | `19 56% 40%`       | Terracotta doubles as warning          |
| `--destructive`        | `0 65% 42%`        | Deep red, enterprise                   |
| `--border` / `--input` | `30 8% 84%`        | Quiet warm gray                        |
| `--ring`               | `218 60% 14%`      | Midnight focus ring                    |
| `--surface`            | `0 0% 100%`        | Same as card                           |
| `--surface-border`     | `30 8% 86%`        |                                        |

Sidebar slot mirrors background with slightly cooler accents.
Dark mode tokens exist in `index.css` but are archived for V2.

## Type

- `--font-sans: 'Inter', system-ui, -apple-system, sans-serif`
- `--font-heading: 'Playfair Display', Georgia, serif`
- **Playfair only on H1/H2** and hero numbers. Everywhere else: Inter.
- Max weight: `font-semibold`. `font-extrabold` / `font-black` are retired.
- Sizes from `tailwind.config.ts`: xs 12, sm 14, base 16, lg 20, xl 24, 2xl 32, 3xl 40.

## Radius

- `--radius: 0.375rem` (6px) — Fluent 2 default
- Tailwind derives `lg = var(--radius)`, `md = calc(var(--radius) - 2px)`, `sm = calc(var(--radius) - 4px)`, plus `pill = 9999px`

## Shadow scale (warm Midnight-tinted)

- `--shadow-2`  — resting cards
- `--shadow-4`  — small lift
- `--shadow-8`  — hover state (`card-hover:hover`)
- `--shadow-16` — popovers, sheets
- `--shadow-28` — modals
- `--shadow-focus` — `0 0 0 3px hsl(var(--ring) / 0.18)`

Available as `shadow-depth-2/4/8/16/28` in Tailwind.

## Motion

| Token              | Value                                  | Use                |
| ------------------ | -------------------------------------- | ------------------ |
| `--motion-fast`    | 100ms                                  | press feedback     |
| `--motion-normal`  | 200ms                                  | hover, color swap  |
| `--motion-slow`    | 300ms                                  | layout transitions |
| `--motion-ease`    | `cubic-bezier(0.33, 0, 0.67, 1)`       | standard           |
| `--motion-decel`   | `cubic-bezier(0.1, 0.9, 0.2, 1)`       | enter              |
| `--motion-accel`   | `cubic-bezier(0.7, 0, 1, 0.5)`         | exit               |

Tailwind aliases: `ease-fluent`, `ease-fluent-decel`, `ease-fluent-accel`, `duration-fast/normal/slow`.

## Density

- `--control-h-compact: 32px` — compact button/input rows, tables, KPI strips
- `--control-h-default: 40px` — default form controls

## Hard rules

- All colors via semantic tokens. **No raw hex in components.** No `text-white` / `bg-black`.
- All colors must be HSL — required for token themability.
- No glassmorphism in `/app`. The `.glass-card` utility name is preserved but now resolves to a Fluent surface (`rounded-md bg-card border depth-2`).
- Brand color rationing is **retired** — Midnight and Terracotta are used semantically (primary, accent/warning). No "moment only" guard.
