

# Preview: TIDE-Inspired Dashboard Mockup

## What We'll Do

Create a single temporary route `/preview` with the Dashboard redesigned in the TIDE glassmorphic style. This page won't affect any existing pages — it's purely for you to review and approve the new look before we roll it out.

## What the Preview Page Will Show

- **Floating pill bottom nav** — frosted glass capsule shape, floating with margin, active item gets a subtle pill highlight
- **Greeting header** — "Good Morning / Afternoon / Evening" with today's date and day-of-week indicator row
- **Glassmorphic KPI cards** — `backdrop-blur-xl`, semi-transparent backgrounds, soft glowing borders, `rounded-2xl`
- **Glass section cards** — Top Distributors and Top Products with frosted treatment
- **Recent Orders** — mobile card view with glass styling
- **Pill-shaped badges and buttons** — `rounded-full` CTAs, softer status badges
- **Dark-friendly palette** — works in both light and dark modes

## Technical Approach

- One new file: `src/pages/PreviewDashboard.tsx`
- One new route: `/preview` in `App.tsx`
- All styles inline or using existing Tailwind utilities — no global CSS changes
- Uses the same mock data as the real Dashboard
- Easy to delete after approval

## After You Review

- **Approve** → we apply the design system across all pages and delete the preview
- **Request changes** → we iterate on the preview page until it's right
- **Reject** → we delete the preview, no harm done

