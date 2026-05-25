## What's wrong

The screenshot is GitHub rendering the **root** `README.md`, which is still the Lovable default:

```
# Welcome to your Lovable project
TODO: Document your project here
```

The polished 434-line README we built earlier lives inside the handover bundle at `app/README.md` — recipient-facing, not what visitors see on GitHub. The repo landing page needs its own world-class README.

## Goal

Replace the root `README.md` with a hero-led, GitHub-optimised landing page that signals seriousness within the first scroll. Modeled on top-tier OSS readmes (Supabase, Linear, Cal.com, Resend) — heavy on visual hierarchy, light on prose.

## Structure

```text
1.  Hero band            Logo · one-line tagline · 5 status badges
2.  Demo callout         "Try it" link · screenshot grid (3 panels)
3.  What is Ledge?       2-3 sentence elevator pitch + bullet list of who it's for
4.  Feature matrix       4-column emoji grid (Orders · Dealers · Stock · Billing)
                         with sub-bullets per cell
5.  Architecture         Mermaid diagram: React/Vite ⇄ Supabase ⇄ Edge Functions ⇄ pg_cron
6.  Tech stack           Compact table (Layer · Tech · Why)
7.  Quick start (60s)    git clone → cp env → ./scripts/setup.sh
8.  Docs index           Linked list pointing at app/README.md, HANDOVER.md,
                         SECURITY.md, CONTRIBUTING.md, supabase/seed/README.md
9.  Project status       Version badge, roadmap callout, "Built with Lovable" line
10. License & contact    Proprietary notice + WhatsApp/email contact
```

## Visual elements (markdown-only, no external services)

- **Shields.io badges**: License · Node · React · TypeScript · Supabase · Last commit · Stars
- **Logo**: reuse `public/striped-square-mark.svg` (or current Ledge mark), centred at 96px
- **Hero screenshot strip**: 3 PNGs in a single row — Dashboard, Orders, Mobile new-order flow. Pulled from `src/assets/` if available; otherwise placeholder boxes with a TODO note for you to drop screenshots later.
- **Mermaid architecture diagram**: renders natively on GitHub, no image hosting needed
- **Centred HTML blocks**: `<p align="center">` for the hero, tagline, badges, and CTA buttons (GitHub renders inline HTML safely)
- **Collapsible `<details>` blocks**: for long sections (full feature list, environment variables) so the page stays scannable

## What it omits (deliberately)

- No long setup walkthrough — that lives in `app/README.md` and is linked from the docs index
- No marketing fluff (no testimonials, no pricing) — that's `getledge.in`
- No internal architecture deep-dives — those go in a future `docs/` folder

## Files touched

| File | Action |
|---|---|
| `README.md` (root) | **Rewrite** from 3 lines to ~180 lines |
| `public/og-image.png` | Add a 1200×630 OG card so link previews look polished (generate via imagegen, premium quality) |
| `.lovable/plan.md` | Updated with completion status |

## Open questions (answer inline or I'll pick reasonable defaults)

1. **Demo URL** — link to `https://www.getledge.in`, `https://ledge-fmcg.lovable.app`, or omit?
2. **Screenshots** — do you want me to generate stylised placeholder images via imagegen, or leave clear `TODO: drop screenshot here` blocks for you to fill in with real captures?
3. **Contact line** — what email / WhatsApp number should I put under "Get in touch"? Or omit entirely?

If you reply "go", I'll default to: `getledge.in` for the demo link, generate 3 stylised hero screenshots via imagegen, and omit the contact line.