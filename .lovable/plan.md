# Design-system docs refresh — make landing↔app parity a 2-pass job

## What's actually wrong with the docs today

I read the live memory + `src/index.css` and the gap is real:

- **`mem://style/design-system`** still describes the **old** Electric-Blue / warm-stone palette. The actual app shipped V2 (Midnight `#0F1F3A` / Forest / Terracotta / Bone, Playfair + Inter, 6px radius, Fluent depth scale). The most-cited doc in the project is wrong.
- **`mem://index.md`** lists ~10 memories (PR9, PR10, PR11, PR12, fluent2-methodology, fluent2-primitives, dashboard-v2, orders-v2, theming-architecture, etc.) that **don't exist as files**. The index is aspirational, not real.
- There is **no single doc** that captures the app's actual visual primitives (`SignalCard`, `KpiStrip`, `InsightLine`, `StatusBadge`) or its CSS utilities (`.h1-display`, `.num`, `.card-hover`, `.row-hover`, `.glass-card` = Fluent surface, `.status-*`). A future landing pass has nothing concrete to mirror.
- **`mem://style/landing-palette`** documents the current landing language (white/paper + indigo `#4F46E5` + `lp-*` primitives). It is the source of the mismatch — landing is on indigo while the app is on Midnight + Terracotta.

Net effect: any "make the landing match the app" prompt today would have to re-derive tokens by reading code. That's why parity has taken many passes.

## What I propose to write (docs only, no app/landing code changes)

### 1. Rewrite `mem://style/design-system` — single source of truth for V2 tokens

Pulled directly from `src/index.css`. Tight, scannable, no prose.

- Brand anchors (HSL): Midnight `218 60% 14%`, Forest `165 50% 11%`, Terracotta `19 56% 40%`, Bone `34 47% 93%`.
- Semantic tokens table: `--background`, `--card`, `--primary`, `--accent`, `--success`, `--warning`, `--destructive`, `--border`, `--ring`, `--muted`, sidebar slots.
- Type: Playfair Display (H1/H2 only) + Inter (everything else). Sizes from `tailwind.config.ts`.
- Radius: `--radius: 0.375rem` (6px), `lg/md/sm` derivation.
- Shadow scale: `--shadow-2/4/8/16/28` + focus ring.
- Motion: `--motion-fast/normal/slow`, `ease-fluent`, decel, accel.
- Density: `--control-h-compact: 32px`, default `40px`.

### 2. New `mem://style/app-visual-language` — patterns the app actually ships

What the landing should mirror at the component/pattern level.

- **Promoted-surface primitives** (already in `src/components/ui/`): `SignalCard`, `KpiStrip`, `InsightLine`, `StatusBadge` — what each is for, the four tiers (`destructive`/`warning`/`success`/`neutral`), and the "one hero card per page" composition rule.
- **CSS utilities** (from `src/index.css`): `.h1-display` (Playfair, responsive), `.num` (tabular-nums), `.card-hover` (Fluent press + depth-8), `.row-hover`, `.glass-card` (= Fluent surface, rounded-md, depth-2 — glassmorphism explicitly **retired in /app**), `.status-paid/partial/pending/dispatched/delivered`.
- **Composition rules**: Playfair only on H1/H2 + hero numbers; everywhere else Inter. Single hero per page. Status colors are semantic, no rationing.
- **Don'ts**: no glassmorphism, no raw hex, no `text-white`/`bg-black`, no font weights heavier than `font-semibold` (`font-extrabold` retired with V2).

### 3. New `mem://style/landing-parity-checklist` — the 2-pass refit playbook

A literal checklist a future Lovable run will execute. Section-by-section, with explicit token swaps.

**Pass 1 — token + type swap** (one PR):
- Replace `--accent-indigo: #4F46E5` → `hsl(var(--accent))` (Terracotta).
- Replace `--ink/--ink-light` indigo → `hsl(var(--primary))` (Midnight).
- Swap landing background ladder: `#FFFFFF` / `#FAFAFB` / `#F4F4F8` → Bone `hsl(var(--background))` + warm tints (`hsl(34 30% 90%)` / `hsl(34 25% 88%)`).
- Headings: `font-extrabold` → `font-semibold`; H1/H2 → `font-heading` (Playfair). Body stays Inter.
- Border radius: `rounded-2xl` / `rounded-3xl` on cards → `rounded-md` (6px). Hero CTA pill keeps pill radius.
- Shadows: ad-hoc CSS shadows → `shadow-depth-4` / `shadow-depth-8`.

**Pass 2 — primitive reconciliation**:
- `lp-*` utilities mapped explicitly:
  - `.lp-capsule-cta` → keep as landing-only CTA signature (re-tinted to Midnight + Terracotta).
  - `.lp-card`, `.lp-card-glass`, `.lp-card-dark` → retire; use app `.glass-card` (Fluent surface) where structure is needed.
  - `.lp-bento-hero`, `.lp-bento-numeral`, `.lp-glass-micro`, `.lp-progress-glass`, `.lp-live-dot` → keep as landing-only flourishes, allowed once per section.
  - `.lp-mesh-*`, `.lp-grid-soft*`, `.lp-noise`, `.lp-vignette-top` → keep as ambient textures, restrained.
- Section CTAs adopt app `<Button>` variants for secondary actions; primary stays the capsule.
- Replace inline `#0A0F1C` / `#475569` / `#64748B` / `#ECEEF2` with semantic tokens (`foreground`, `muted-foreground`, `border`).
- Pricing card hierarchy follows app's "one promoted tier per surface" rule (already true) — re-tint promoted tile to Terracotta wash, not sky/indigo.

**Regression gates** (binary, easy to verify):
- `rg "#[0-9A-Fa-f]{3,6}" src/components/landing` returns zero matches (no raw hex).
- `rg "indigo|sky-|violet" src/components/landing` returns zero matches.
- `rg "font-extrabold|font-black" src/components/landing` returns zero matches.

### 4. Demote `mem://style/landing-palette` to legacy snapshot

Add a frontmatter note: "Pre-rebrand landing language. After parity pass, replaced by `landing-parity-checklist`." Keep the file so historical PRs make sense, but the index entry points to it as legacy.

### 5. Rebuild `mem://index.md` so it reflects reality

- Remove links to files that don't exist (`pr9-polish-pass`, `pr10-composition-pass`, `pr11-pattern-break`, `pr12-money-pages`, `fluent2-methodology`, `fluent2-primitives`, `dashboard-v2`, `orders-v2`, `pr6-dealers-sales-stock`, `pr7-reports-billing-perf`, `theming-architecture`, `toast-notifications`, `interactions`, `mobile-first-design`, `aesthetic`, `human-centric-design`, `branding-assets`, `brand-moments` if unused, `landing-page`, `modal-strategy`, `number-inputs` — verify each before dropping).
- Promote the three new/updated docs to the top of the Memories list.
- Tighten the **Core** block to one paragraph that names: V2 tokens (Midnight/Forest/Terracotta/Bone), Playfair+Inter, 6px radius, Fluent depth/motion, no glassmorphism in /app, mobile-first PWA, Lovable Cloud + RLS, no Google OAuth.

## Files touched (memory only)

- `mem://style/design-system` — rewritten.
- `mem://style/app-visual-language` — **new**.
- `mem://style/landing-parity-checklist` — **new**.
- `mem://style/landing-palette` — frontmatter note added, content kept.
- `mem://index.md` — pruned + reordered, real links only.

## Non-goals

- No changes to `src/index.css`, `tailwind.config.ts`, app components, or landing components in this pass. Docs only.
- No actual landing rebrand yet — that lands in the next plan, executing the new checklist.
- No removal of `lp-*` CSS in `src/index.css` until the rebrand pass runs (avoid breaking the live landing).

## Why this hits the "2-pass parity" goal

Today: a refit prompt has to read code to learn the tokens, guess the primitives, and rediscover what "matching the app" means. Three docs change that:

- **`design-system`** answers "what tokens?" in one screen.
- **`app-visual-language`** answers "what do app pages look like, in primitives I can re-use?".
- **`landing-parity-checklist`** answers "what exactly do I change on landing?" with grep-able regression gates.

After this, the next landing pass is a mechanical execution of the checklist, not a design exploration.
