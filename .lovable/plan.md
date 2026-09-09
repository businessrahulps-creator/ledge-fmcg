# Landing page: taste-skill audit and fixes

I read the "taste skill" (an anti-generic design rulebook for landing pages) and ran its
pre-flight checklist against every section of our landing page.

**Design read:** B2B landing for Indian FMCG owners and super-stockists, trust-first,
graphite-and-white with blue as punctuation. Our existing direction is right. The problems
are repetition, over-labelling, and a few honesty issues, not the look.

**Score against the checklist: 11 of 60 checks fail.** None are catastrophic. Fixing them
removes the "made by a template" feel and makes the page shorter and more believable.

## What fails, and the fix

### 1. Too many small uppercase labels (the biggest one)
Every section opens with the same tiny caps label: "Features", "How it works", "Pricing",
"The old way", "Built different", "From the field", "From the founder", "Before & After
Ledge", "Ledge Intelligence". Ten of them on twelve sections. The rulebook allows one per
three sections, because repeating them makes every section feel identical.

Fix: keep at most four. Suggested keepers - hero, Features, Pricing, and one more. Drop the
rest; the headline already says what the section is, and the position on the page already
categorises it.

### 2. Two banned labels
"From the field" and "From the founder" are both called out by name as performative
labels. Replace with plain wording ("What owners say") or drop entirely, which item 1
already does.

### 3. Hero carries five things instead of four
Eyebrow + headline + subtext + two CTAs + the "Offline-ready / GST-ready / Built in
Kerala" chip row. The chip row is a trust strip and belongs below the hero, not inside it.
Fix: move those three chips into the trust band directly under the hero. This also gets the
CTA higher on mobile.

### 4. The customer logo wall is plain text, and the names are invented
"Aryan Beverages", "Nova Retail Co.", "Sterling FMCG" etc. are rendered as text pills. Two
problems: fake-sounding invented brands are a known tell, and text wordmarks read as
placeholder. Options, your call:
- **(a) Replace with real customers** you can name, with real logos. Strongest.
- **(b) Remove the logo strip** and keep only the four statistics, which are the honest part.
- **(c) Keep it but relabel** so it never claims these are customers.
I recommend (b) until we have logo permission, then (a).

### 5. Statistics need a source line
"2-3 hrs wasted daily", "5-10% revenue lost", "80% admin work eliminated" read as invented
precision. Add one small line under the row naming where they come from (our own field
interviews across N distributors), or soften to ranges we can defend.

### 6. Repeated call-to-action wording
The page says "Start 30-Day Free Trial" (hero), "Start Free Trial" (nav, pricing, final),
and "Start free" (mobile bar). Same intent, four labels. Pick one - "Start Free Trial" -
and use it everywhere.

### 7. Decorative status dots
Small pulsing dots appear in five places (final CTA, Intelligence panel twice, Why Ledge).
They mean nothing there. Keep one, where it genuinely signals live activity; remove the
rest.

### 8. Em-dashes in visible copy
The rulebook bans them outright, and they render inconsistently on Android. Sweep every
visible string on the landing page and replace with a plain hyphen or a full stop. Code
comments are unaffected.

### 9. Layout repetition
Problem, Outcome and Why Ledge use a similar heading-plus-column-block shape back to back.
Break one of them into a different shape - a full-width statement, or a stacked two-part
comparison - so the eye gets a change of beat.

### 10. Section headings split left/right
Some sections put a big headline on the left and a small paragraph floating on the right.
Stack them instead: headline, then the paragraph directly under it, capped to a comfortable
reading width.

### 11. Hand-drawn product graphics
Several sections illustrate the product with hand-built shapes rather than real product
imagery. The hero already uses a real generated visual, which is right. This is a bigger
piece of work, so I am flagging it rather than doing it now: over time, replace the
hand-drawn panels in Features and Intelligence with real product screenshots.

## What already passes
One theme lock, one accent colour, one corner-radius scale, single-line navigation under
80px, real testimonial portraits with full names and roles, reduced-motion support, skip
link, image dimensions set, no scroll cues, no version stamps, no fake dashboards in the
hero.

## Scope

Items 1-10 in this pass. Item 11 flagged for later. Landing page only - the app at
`/app` is untouched.

Files: the twelve section components under `src/components/landing/sections`, plus
`MobileStickyCtaBar.tsx`, `NavCommandPalette.tsx`, `MobileMenuOverlay.tsx` and the landing
block of `src/index.css`. Guardrail tests get new rules for the eyebrow cap, the single CTA
label and the em-dash ban, so none of this creeps back.

Verification: full test suite, screenshots at phone and desktop widths, and a check that
the hero call-to-action is visible without scrolling on a small phone.

**One decision needed from you: item 4 - keep, replace, or remove the customer logo strip.**
