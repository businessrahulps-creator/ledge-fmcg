

# Doc / How-to Section

## Navigation Placement

Add a **"Help"** item to the sidebar's bottom nav (next to Settings), using the `BookOpen` icon from Lucide. Route: `/help`. This keeps it always accessible without cluttering the main nav groups.

## Page Structure

A single `/help` page using `AppLayout`, with an accordion-based layout (using the existing `Accordion` component). Content is organized into 5 practical sections — no feature-by-feature docs, just workflows and best practices.

### Content Sections

| # | Section | What it covers |
|---|---------|----------------|
| 1 | **Getting Started** | First 15 minutes: company setup → add products → add dealers → first order. The "golden path" to value. |
| 2 | **Daily Workflow** | Morning routine: check dashboard → capture orders → dispatch → collect payments → end-of-day review. |
| 3 | **Managing Your Business** | Stock & warehouses, dealer credit limits, schemes & discounts, targets, returns/claims — how they work together. |
| 4 | **Reports & Performance** | Which reports to check weekly/monthly, how to track salesperson performance, how to spot trends. |
| 5 | **Tips & Common Mistakes** | Practical do's and don'ts: order prefix consistency, keeping stock updated, using billing correctly, data backup. |

### Design

- Page header: "How to Use Ledge" with a brief subtitle
- Each section is an `AccordionItem` with clear headings
- Content inside uses simple prose with occasional bold callouts and ordered lists
- Glassmorphic card wrapper matching the rest of the app
- Mobile-first: full-width, comfortable reading on 375px screens

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Help.tsx` | **New** — the help page (~200 lines of JSX content) |
| `src/App.tsx` | Add `/help` route (~2 lines) |
| `src/components/layout/AppSidebar.tsx` | Add "Help" to bottom nav (~2 lines) |

**3 files (1 new, 2 modified). No database changes. No new dependencies.**

