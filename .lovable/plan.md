# Plan: Ledge Presentation Content (Work / Catalog / Relationship / Insights)

## Goal
Produce a single Markdown file you can paste straight into slides (or hand to a designer). Content is organized into the 4 pillars you named, with **Insights (My Business)** treated as the hero section — longer, sharper, with the "so-what" called out for an FMCG founder/distributor audience.

## Where it lands
`/mnt/documents/ledge-presentation-content.md` — delivered as a downloadable artifact at the end. No source files in the app are touched (plan mode + content-only request).

## Structure of the .md

Each pillar follows the same shape so it slots into slide templates cleanly:

1. **One-line promise** (slide title sub-line)
2. **What it is** (2–3 sentence narrative)
3. **What the user does** (3–5 bullet "jobs to be done", plain English, Indian FMCG language — pucca orders, dispatch, claims, schemes, beat, etc.)
4. **What Ledge does for them** (3–5 bullet capability list, tied to real features in the app)
5. **Proof points / numbers** (pulled from the live demo workspace: 26 SKUs, 28 dealers, 12 reps, 257 orders, 188 GST invoices, 13 claims, 51 targets — so the deck has real texture, not lorem)
6. **One-line "why it matters"** (the founder takeaway)

## Pillar coverage

- **Work** — the daily operating layer.
  Sources: Orders, NewOrder, OrderDetail, Dispatch flow (`dispatch_order_atomic`), Claims, Targets, Schemes, Command page, Notifications.
  Angle: "Run the day in under 10 taps." Speed, mobile-first, atomic + reversible, offline-tolerant UX.

- **Catalog** — the product + price + stock truth layer.
  Sources: Stock page (products + warehouses), Schemes, Billing/GST.
  Angle: "One source of truth for SKUs, MRPs, schemes, and live stock — across cold-chain warehouses."

- **Relationship** — the dealer + sales-team layer.
  Sources: Distributors, DealerDetail, Salespersons, SalespersonDetail, Performance, Claims resolution.
  Angle: "Every dealer and every rep has a profile, a history, and a scorecard. Nothing lives in a WhatsApp scroll."

- **Insights (My Business)** — *hero pillar, ~40% of the deck weight.*
  Sources: Dashboard, Reports (Dealer / Product / Payment / Dispatch / Sales Team), Performance, Credit-at-Risk surface, KPI strip, signal cards, scorecards.
  Sub-sections inside this pillar:
  1. **What you see the moment you open the app** — Dashboard hero KPIs in plain English (today's orders, money in, money at risk, stock health).
  2. **The five reports that answer the five questions a founder asks every Monday** — who's buying, what's selling, who owes me, what shipped, who's hitting target.
  3. **Credit at Risk** — promoted signal card; one number that protects your cashflow.
  4. **Scorecards** — dealer scorecard, rep scorecard, product scorecard; how Ledge ranks and why.
  5. **Decisions Ledge makes easy** — concrete examples ("drop this SKU from the next scheme", "put this rep on the cold-chain beat", "stop credit to this dealer for 14 days").
  6. **The roadmap line** — AI-assisted insights coming next (tied to your approved Gemini roadmap, kept one-line and non-promisory).

## Tone & language rules

- Founder-to-founder, Indian FMCG vocabulary (beat, pucca, party, claim, scheme, primary/secondary sales).
- No jargon from the codebase (no "RPC", "RLS", "DataContext").
- Numbers wherever possible — soft claims get cut.
- Each slide-block ≤ 40 words so it survives on a projected slide.
- Short, declarative. No marketing fluff like "revolutionize" / "seamless" / "unlock".

## Deliverable

A single `ledge-presentation-content.md` with:

- A 1-slide **Cover** (product one-liner + the 4-pillar map)
- A 1-slide **The 4 Pillars** overview (so the audience knows the arc)
- 1 section per pillar (Work, Catalog, Relationship) — ~2 slides of copy each
- **Insights (My Business)** — ~6 slides of copy, treated as the hero
- A closing **"Why this matters now"** slide (Indian FMCG distribution context, 2026)

Total: ~14–16 slides of ready copy. You decide how many you actually use.

## What I will NOT do in this task

- No code changes.
- No new app screens or routes.
- No design directions / mockups — this is copy only. If you also want slide visuals after reading the .md, ask and I'll spin up a slides app or a .pptx.
