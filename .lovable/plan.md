

# High-Impact Onboarding System

## Design Philosophy

For non-tech-savvy Indian FMCG business owners, the onboarding must feel like a helpful assistant — not a software wizard. No multi-step modals, no overwhelming checklists. Instead: **a persistent, friendly setup checklist on the Dashboard** that disappears once complete, plus a **one-time welcome screen** after first signup.

## Architecture

### 1. Onboarding Checklist Hook (`src/hooks/use-onboarding.ts`)

A single hook that computes setup completion by querying real data:

| Step | Check | Links to |
|------|-------|----------|
| Company details | `companies.gstin` is not empty | `/company` |
| Upload logo | `companies.logo_url` is not empty | `/company` |
| Add first dealer | `distributors` count > 0 | `/distributors` |
| Add first product | `products` count > 0 | `/stock` |
| Add first salesperson | `salespersons` count > 0 | `/salespersons` |
| Create first order | `orders` count > 0 | `/orders/new` |

Returns: `{ steps, completedCount, totalSteps, isComplete, percentage }`. Uses existing data from `useApi()` — no new DB queries. Dismissed state stored in `localStorage` so users can hide it permanently.

### 2. Dashboard Setup Card (`src/components/onboarding/SetupChecklist.tsx`)

A glassmorphic card shown at the **top of the Dashboard** (above KPIs) when setup is incomplete:

- Circular progress ring showing completion (e.g., "3 of 6")
- Each step is a tappable row: icon + label + status (checkmark or "→" arrow)
- Tapping an incomplete step navigates directly to the relevant page
- "Dismiss" link at the bottom to hide permanently
- Animates out when all steps are done (with a brief celebration message)

### 3. Post-Signup Welcome (inline on Dashboard)

Instead of a blocking modal, for **brand-new accounts** (0 orders, 0 dealers, 0 products), the Setup Checklist card gets a welcome header:

> "Welcome to Ledge! Let's get your workspace ready in 5 minutes."

This disappears once any step is completed.

### 4. Settings Badge (existing users)

In the sidebar nav, show a small indigo dot badge next to "Company" if GSTIN or logo is missing. This is a 3-line change in `AppSidebar.tsx`.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/use-onboarding.ts` | **New** — hook computing setup steps from live data (~60 lines) |
| `src/components/onboarding/SetupChecklist.tsx` | **New** — glassmorphic checklist card (~120 lines) |
| `src/pages/Dashboard.tsx` | Insert `<SetupChecklist />` above KPI grid (~3 lines) |
| `src/components/layout/AppSidebar.tsx` | Add dot badge on "Company" nav item when incomplete (~5 lines) |

**4 files total (2 new, 2 modified). No database changes. No new dependencies. No new routes.**

## UX Details

- Mobile-first: card is full-width, steps are large touch targets (48px rows)
- Progress ring uses the indigo primary color
- Completed steps show a muted checkmark, incomplete steps show an arrow with subtle indigo accent
- The card uses the existing `glass-card` class for visual consistency
- `localStorage` key: `ledge_onboarding_dismissed` — respects per-user dismissal
- Seed data from signup means dealers/products/orders may already exist, so the checklist correctly reflects pre-seeded state

