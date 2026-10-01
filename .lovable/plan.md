# Ledge in black and white: a clean, professional look across the signed-in app

You want the signed-in app to look like the screenshot you sent: a pure white page, near-black text and lines, thin grey dividers, plain sans-serif type and no cream. This plan changes how the app looks only. Every number, button, page and rule stays exactly as it is today.

## What the reference does (and what we'll copy)

- **White everywhere.** The page, the cards and the menu are all white. A very light grey frame sits around the main card.
- **Black is the only strong colour.** Headings, numbers, the chart line, the selected tab and the main buttons are near-black. Everything else is grey.
- **Green and red only carry meaning.** They appear only for up/down changes.
- **Thin grey lines instead of shadows.** The figures in the top row are split by hairlines. The selected one gets a black underline.
- **Plain, confident type.** One sans-serif font. Large, bold, even-width numbers. Small grey labels.
- **Quiet controls.** Grey pill switches (7D / 30D / 90D) with a white selected chip, and white outlined buttons such as "Export".
- **Charts in greyscale.** A black line over a soft grey fill, with faint grid lines.
- **Ranked lists as grey bars** behind the label, with the number on the right.

## What changes in Ledge

1. **Colours.** Cream becomes white, navy becomes near-black, warm greys become neutral greys. Terracotta is no longer used for decoration. It stays only for real warnings (such as an overdue bill), alongside green for good and red for problems.
2. **Type.** Page titles drop the curly Playfair font and use Inter in semibold, like the "Analytics" title in your screenshot. All money and counts use even-width digits.
3. **Cards and edges.** White cards with a 1px light-grey border and almost no shadow. Corners: 12px on cards, 8px on buttons and inputs, full round on small pills. The app gets the light grey outer frame like the reference.
4. **Side menu and top bar.** White, with a thin dividing line. The current page is shown in black text on a light grey background, with no navy fill.
5. **Buttons.** The main action is black with white text. Secondary actions are white with a grey outline, like "Export". Period choices become the grey pill switch.
6. **Key figure strips (Dashboard, My Business, Orders, Money to Collect).** These are redone as one bordered row of figures split by hairlines. Each shows a grey label, a big black number and a green or red change line. The highlighted figure gets a black underline.
7. **Charts.** All charts move to a black line with a grey fill and faint grid lines. Team and product comparisons use shades of grey instead of brand colours.
8. **Top dealers, products and similar lists** become the grey-bar ranking style.
9. **Status badges** (Paid, Pending, Dispatched and so on) become quiet outlined pills with a small coloured dot. Colour shows only on states that need attention.
10. **Tables.** White rows, hairline dividers, a small grey header row and a light grey highlight when you point at a row.

## Not changing

- **The public website (getledge.in) and the Ops admin panel:** they keep their current look.
- **PDF bills and statements:** they already print black on white.
- **Content and behaviour:** no wording, numbers or behaviour changes.

## How Astra fits in

1. **Before building:** I take screenshots of the current Dashboard, Orders, Money to Collect, My Business and Stock, on desktop and phone. I send them to the Astra model with your reference image, and Astra reviews them against the reference: what still feels cream or old-fashioned, where the order of importance is unclear, and which colours or shapes don't match. I fold its notes into the build and share a short summary with you.
2. **After building:** I take the same screenshots again and send them back to Astra for a check against the reference. I fix anything it flags that fits these rules, then repeat once.

## Order of work

1. Astra review of the current screens, then a short summary to you.
2. The new colours, type and corners for the whole signed-in app (most screens update automatically from this).
3. Side menu, top bar, buttons, period switch and status badges.
4. Figure strips, charts and ranked lists on Dashboard and My Business.
5. Clean-up of leftover cream or hard-coded colours on the remaining pages: Orders, Money to Collect, Returns, Stock, Schemes, Targets, Dealers, Sales Team, Company and Settings.
6. Astra check of the finished screens, fixes, then desktop and phone screenshots for you.

## Technical section

- `src/index.css` `:root`: background `0 0% 100%`, foreground `0 0% 9%`, card `0 0% 100%`, primary `0 0% 9%` / primary-foreground `0 0% 100%`, secondary and muted `0 0% 96%`, muted-foreground `0 0% 45%`, border and input `0 0% 90%`, ring `0 0% 9%`, accent `0 0% 96%` (neutral), success `142 64% 30%`, destructive `0 72% 45%`, warning stays terracotta `19 56% 40%`. Sidebar tokens: white background, accent `0 0% 96%`, border `0 0% 92%`. `--radius: 0.75rem`. Shadow scale is flattened (`--shadow-2` becomes a 1px hairline; depth-8 or higher only for popovers and modals). The `.lp-theme` and ops scopes are left untouched.
- `.h1-display` and `.h2-display` switch to Inter 600 with tight tracking. The Playfair link stays in `index.html` for the landing page only. Add `font-feature-settings: "tnum"` to `.num` and the stat utilities.
- New shared pieces in `src/components/ui/`: `StatRow` (a hairline-split figure row with an optional active underline, which replaces the current KPI strip visuals) and `RankBars` (grey-bar list). `KpiStrip`, `SignalCard` and `StatusBadge` are restyled in place, so the pages that use them update without edits.
- `.glass-card`, `.card-hover` and `.timeframe-pill` are rewritten for the new look. Period pickers (`PeriodSelector`, `TimePeriodFilter`) use a segmented pill.
- Chart colours go through one greyscale palette helper used by Recharts and `@/lib/svgTokens`.
- Run `rg` for leftover raw colours (`bg-amber`, `text-emerald`, `#F5EFE6`, hsl cream values, `font-heading`) under `src/pages` and `src/components` (excluding landing and ops) and move them to tokens.
- Astra calls run server-side from the sandbox through the AI gateway (`openai/gpt-6-astra`, Responses API with image inputs). No code is added to the app for this.
- Memory: update `mem://style/design-system`, the Core line in `mem://index.md` (Midnight/Bone/Playfair becomes monochrome Inter) and `app-visual-language`. Record the retired cream palette.
- Checks: `bunx tsgo --noEmit`, `bunx vitest run` (320 baseline, updating any brand-token tests that assert the old colours on purpose), the build log, and Playwright screenshots at 1280 and 393 widths of every main page.
