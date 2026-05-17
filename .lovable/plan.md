
# Brand Color Placement Plan

Principle: each brand color = one job. We are not adding decoration. We are promoting moments where the color already *means* something so the brand reads as intentional, not painted on.

Tokens stay as-is (`--midnight`, `--success` Forest, `--warning` Terracotta, `--background` Bone). No new hex values. No raw colors in components.

---

## PR-A — Terracotta promotion: attention that needs a human

**Why first:** lowest risk, highest emotional payoff. Terracotta already exists as warning; we're sharpening *where* it shows up.

Scope:
- **Aging buckets in Billing** — 30+ neutral, 60+ Terracotta wash + left-bar, 90+ destructive. Today it's a flat color ramp; intensify the 60+ Terracotta moment.
- **Credit at Risk SignalCard** — already promoted (PR11); lock canonical Terracotta tokens, remove any lingering amber.
- **Claims page header accent** — thin Terracotta top-rule on PageHeader, signals "warm conversation, not error."
- **First-week onboarding active chapter** — Terracotta left-bar on the currently-active ChapterCard.

Files: `src/pages/Billing.tsx`, `src/pages/Claims.tsx`, `src/components/onboarding/ChapterCard.tsx`, `src/index.css` (one new `.aging-warn` utility if needed).

---

## PR-B — Forest promotion: money in, health

Scope:
- **Revenue recognized KPI** on Dashboard + Performance — Forest underline accent beneath the number (not on the number).
- **Payment received rows** in Billing — Forest left-bar on `status=paid` rows (mirrors how pending gets warning today).
- **Targets ≥ 100%** — Forest pill with tiny up-tick on Targets cards and Salesperson scorecards.
- **Stock "healthy" badge** — canonicalize on Forest token (some places still use raw emerald per PR6 notes — sweep).

Files: `src/pages/Dashboard.tsx`, `src/pages/Performance.tsx`, `src/pages/Billing.tsx`, `src/pages/Targets.tsx`, `src/pages/SalespersonDetail.tsx`, `src/pages/Stock.tsx`.

---

## PR-C — Midnight as letterhead: authority and finality

Scope:
- **PDF letterhead pass** — unify Midnight band across `OrderInvoicePdf`, `GstInvoicePdf`, `DealerStatementPdf`, `SalespersonStatementPdf`, `PerformanceReportPdf`, `ReportPdf`. One shared `PdfHeader` styling.
- **Detail page Midnight band** — thin 4px Midnight rule above PageHeader on DealerDetail, OrderDetail, SalespersonDetail. "Record of truth."
- **Reconciled / locked rows** — faint Midnight left-bar on reconciled orders and closed-period rows (currently generic muted).

Files: `src/components/pdf/PdfHeader.tsx`, `src/components/pdf/PdfStyles.ts`, all `src/components/pdf/*Pdf.tsx`, `src/pages/DealerDetail.tsx`, `src/pages/OrderDetail.tsx`, `src/pages/SalespersonDetail.tsx`, `src/components/ui/page-header.tsx` (optional `accent` prop).

---

## PR-D — Bone as stationery + audit sweep

Scope:
- **PDF body background** — explicit Bone (not pure white) so printed Ledge documents read as branded stationery.
- **Settings section dividers** — Bone bands between groups for editorial rhythm on Settings + Company pages.
- **Audit sweep** — `rg "emerald-|amber-|red-|blue-|orange-"` across `/src/pages` and `/src/components` (excluding `/landing`). Convert any survivors to semantic tokens. This is the final cleanup of the PR6/PR7 migration.

Files: `src/components/pdf/PdfStyles.ts`, `src/pages/Settings.tsx`, `src/pages/Company.tsx`, plus whatever the sweep surfaces.

---

## Out of scope (explicit)

- Landing page — has its own tinted-card system (`mem://style/landing-tinted-cards`) and its own rebrand plan. Untouched.
- Tinting random Cards in `/app` — would dilute Bone-as-surface. Forbidden.
- Gradients on brand colors — kept flat and honest.
- Hover/press states — those stay depth tokens, never brand color.
- Dark mode — archived for V2.

## Memory updates after each PR

Append a short memory under `mem://style/brand-placement-<pr>` recording what shipped and which tokens are now canonical for that meaning.

## Suggested order

A → B → C → D. Each is independently shippable. PR-A and PR-B are ~1 session each. PR-C is the largest (PDF unification). PR-D is a cleanup.

---

Approve and I'll start with PR-A.
