# Landing page redesign: black and white, built from the uiarc library

## Goal
Rebuild every section of the public landing page below the menu, so it looks like your app: black and white, with no gradients, glow or grain. Every block is built from uiarc.dev's free components, so the page feels like a working product instead of a brochure. The top menu stays exactly as it is.

## How we get there
1. **Astra reviews the whole library (maximum setting).** Astra goes through every uiarc component, around 100 of them, plus the pro illustration section. For each one it decides whether it fits a landing page for Indian distributors, and which section it should go in. Fable 5.1 then reviews Astra's picks for taste and how easy they are to read.
   - **Pro components, used with the maker's permission:** we'll include the pro illustrations and recolour them to black and white. Where the pro code shows on the site, I'll take it from there. If any piece is locked behind a sign-in, I'll ask you to paste its code or have your friend share it.
2. **One look, locked, and every section matching.** Black ink on white, with greys for depth. No coloured backgrounds and no gradients. One dark section in the middle and one at the end for rhythm. The fonts stay the same as the app. Every section follows the same building blocks, so each one leads naturally into the next and nothing looks out of place:
   - the same page width and spacing between sections;
   - each section opens the same way: a small label, a headline and one line of text;
   - the same card corners, thin borders and illustration style throughout;
   - the light, grey and dark backgrounds alternate in a steady beat;
   - the same gentle animation as things scroll into view.
   Pages open fast, and animation turns off for people who ask their phone for less motion.
3. **Rebuild the sections, keeping your words, prices, contact details and sign-up buttons:**

| Section | New treatment (uiarc parts) |
| --- | --- |
| Hero | Big headline that reveals as you scroll (In-view title), a short announcement bar, and a live "today's orders" feed (Realtime stream) next to number counters |
| Trust bar | Number counters with thin dividers |
| Who it's for | Chip group of business types |
| Problem | Before / after slider (Image compare): WhatsApp chaos vs. Ledge |
| How it works | Three steps in a card stack, each with a small working preview |
| Outcome | Metric cards plus line and bar charts in grey |
| Ledge Intelligence | The dark section: a chat thread showing Today's work suggestions |
| Features | Expandable cards in a tidy grid |
| Why Ledge | Comparison table (Data grid) vs. spreadsheets and WhatsApp |
| Testimonials | Carousel with avatar group |
| Founder | Plain quote card with signature |
| Pricing | Monthly/yearly switch (Billing toggle) plus three plan cards; your existing prices |
| FAQ | Accordion (new, built from your existing help answers) |
| Final call to action | The dark closing section: one headline and one button |
| Footer | Same links, restyled in black and white |

4. **Check it hard.** I'll take screenshots on a phone, tablet and computer, and compare them side by side with the app. The page has to load fast, and every link and button has to still work. Fable does one final review, and I'll fix whatever it finds.

## What stays the same
The menu, every word and price you've approved, your contact number and email, sign-up and login links, SEO titles, and the app itself.

## Budget
Up to 100 credits, covering the Astra library review, the build, the Fable review and the fixes.

## Technical details
- Astra via /v1/responses (gpt-6-astra, high reasoning) and Fable via the gateway's /v1/messages (claude-fable-5-1). Their reports are saved under /tmp; only the picked components are installed, from the free uiarc registry.
- New monochrome tokens are scoped under `.lp-theme` in index.css. The retired classes `.lp-block-graphite`, the electric and blue accents, and ShaderBackdrop are no longer used. Update `LANDING-DESIGN-SYSTEM.md` and the guard tests (`landing-design-system`, `brand-placement`) to ban gradients.
- Section components are rewritten in place under `src/components/landing/sections/`; `Navbar.tsx` is not touched. Heavy parts (charts, carousel) are lazy-loaded below the fold.
- Verify with Playwright at 390, 768 and 1440 widths, plus the full Vitest suite.
