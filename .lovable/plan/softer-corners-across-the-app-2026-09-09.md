# Softer corners across the app

Today every card, table and button in the app uses a 6px corner — technically neat, but it reads boxy on big screens like Orders and order detail. We'll move to a gently rounded 10px scale so the app feels calmer and more modern, without becoming playful.

## What changes

- Cards, panels, tables, sheets and dialogs get a softer 10px corner.
- Buttons, inputs and dropdowns get a matching slightly smaller corner (8px) so they nest neatly inside cards.
- Small chips, badges and status pills stay pill-shaped as they are today.
- Nested elements (a chip inside a card, a table inside a panel) keep a smaller corner than their container, so corners never look doubled up.
- The public website keeps its own separate look — nothing there changes.

## What does not change

No content, buttons, numbers, colours, spacing or behaviour. This is purely the shape of edges.

## Technical notes

- Raise `--radius` in `src/index.css` from `0.375rem` to `0.625rem`; the Tailwind `lg/md/sm` radius tokens already derive from it, so most surfaces update automatically.
- Audit hardcoded radius values that bypass the token: `rounded-lg`, `rounded-xl`, `rounded-[6px]`, and the raw `border-radius` declarations in `src/index.css` (e.g. `.glass-card`, well/tile utilities at lines ~813, 942, 966, 998, 1303, 1361, 1406) so they align to the new scale instead of drifting.
- Leave `--lp-r-*` landing tokens and `.lp-theme` rules untouched.
- Leave `9999px` pill radii untouched.

## Verification

- Screenshots of Orders, Order detail, Dashboard, Stock, Dealers and the mobile Menu sheet at desktop and phone widths.
- Typecheck, test suite and build.
