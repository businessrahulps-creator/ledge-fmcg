# Landing page: taste-skill polish pass + colour refinement

I read the "taste skill" (an anti-generic design rulebook for landing pages) and ran its
checklist against every section of our landing page.

**Design read:** B2B landing for Indian FMCG owners and super-stockists. Trust-first,
graphite and white, blue as punctuation. The direction is right; the problems are
repetition, over-labelling and two honesty gaps.

**Every section stays.** Nothing gets deleted. This is a polish pass only.

## Part 1 - The fixes

### 1. Too many identical small caps labels (biggest issue)
Ten of the twelve sections open with the same tiny uppercase label: "Features", "How it
works", "Pricing", "The old way", "Built different", "From the field", "From the founder",
"Before & After Ledge", "Ledge Intelligence". Repeating that shape makes every section feel
like the same section again.

Fix without losing anything: keep the label on four sections (hero, Features, Pricing,
Ledge Intelligence). For the other six, fold the label's meaning into the headline instead
of deleting the idea. Example: "The old way" label plus its headline becomes a single
stronger headline that says the same thing. No content lost, six repetitions gone.

### 2. Two labels get replaced
"From the field" and "From the founder" both read as performative. "From the field" becomes
part of the testimonials headline; the founder note keeps its section and its photo-free
layout, just without the label.

### 3. Hero is carrying one element too many
Hero currently holds: label, headline, subtext, two buttons, and the "Offline-ready /
GST-ready / Built in Kerala" chip row. The chip row is trust proof, so it moves down into
the trust band immediately below the hero, where it sits next to the statistics. Nothing is
removed and the main button rises higher on a phone screen.

### 4. Customer logo strip - one decision from you
"Aryan Beverages", "Nova Retail Co.", "Coastal Naturals", "Horizon Foods", "Sterling FMCG",
"Crest Agencies" are shown as scrolling text pills. They read as placeholder, and invented
customer names are a real credibility risk if anyone checks. Section stays either way.
Options:
- **(a)** Swap in customers we can genuinely name, with their real logos. Strongest.
- **(b)** Keep the strip, relabel it honestly - for example "Built for businesses like"
  followed by category words (beverages, snacks, personal care, dairy) instead of invented
  company names.
- **(c)** Leave as is.
I recommend (b) now and (a) once we have logo permission.

### 5. Statistics need a source
"2-3 hrs wasted daily", "5-10% revenue lost", "80% admin work eliminated" read as invented
precision. Add one small line under the row naming the source (our own distributor
interviews). Keeps the numbers, adds the credibility.

### 6. One button label, everywhere
The page currently says "Start 30-Day Free Trial", "Start Free Trial" and "Start free".
Standardise on **Start Free Trial** in the nav, hero, pricing, mobile bar, mobile menu and
final CTA. The "30 days, no card" detail stays as supporting text under the hero button.

### 7. Decorative dots
Pulsing dots appear in five places where they signal nothing. Keep the one in the final CTA
("used by businesses across 12 states"), drop the rest.

### 8. Long dashes in visible copy
Sweep every visible sentence and replace the long dash with a plain hyphen or a full stop.
They render inconsistently on older Android browsers. Code comments untouched.

### 9. Break one repeated layout shape
Problem, Outcome and Why Ledge run three similar heading-plus-blocks shapes back to back.
Reshape Outcome into a single full-width before/after comparison so the middle of the page
gets a change of beat. Same content, different composition.

### 10. Stack the split section headers
Where a big headline sits left with a small paragraph floating right, put the paragraph
directly under the headline at a comfortable reading width. Easier to read, less
"designed-looking".

### 11. Flagged for later, not this pass
Several sections illustrate the product with hand-drawn shapes rather than real screens.
The hero already uses a real visual. Over time these should become real product
screenshots. Larger job, separate pass.

## Part 2 - Colour

Today the landing runs Electric blue `#1B57F5`, Ink `#1B2130`, Lime `#C8F250` and a Mist
`#E5E4F0` page background, with graphite hero and final CTA.

Honest assessment: the structure is good, but three things weaken it.

1. **Lime is dead weight.** It was already demoted after your earlier feedback and now
   appears in a handful of places doing nothing recognisable. A colour that shows up rarely
   and means nothing is worse than not having it. Two choices: give lime **one job** across
   the whole page (I suggest "money recovered / gain" - so lime always means upside and
   nothing else), or retire it and let blue carry the accents alone. I recommend giving it
   one job, since a second colour keeps the page from feeling monotone.

2. **The Mist page background is slightly lilac.** Against pure-white cards it reads faintly
   purple, which is the exact tint the rulebook flags as the AI-default look, and it fights
   our graphite hero. I recommend shifting it to a neutral cool grey - same lightness, drop
   the purple bias. The page instantly reads more expensive and more neutral, and nothing
   else needs to change.

3. **Status colours should never look like brand colours.** Healthy / attention / overdue
   currently sit close enough to the brand blue and lime that a quick glance can misread
   them. Pull green and red apart from the brand hues so "at risk" always reads as at risk.

Final recommended palette:
- Ink `#1B2130` - text and dark blocks (unchanged)
- Electric `#1B57F5` - one action colour, buttons and links (unchanged)
- Neutral cool grey page ground, replacing the lilac Mist
- White - cards
- Lime, restricted to gain and money-recovered moments only
- Green / amber / red for status, visibly separate from brand hues

This is a token-level change in one file, so it applies everywhere at once and can later be
carried into the app.

## Scope

Landing page only. The app at `/app` is untouched.

Files: the twelve section components under `src/components/landing/sections`, the mobile
bar, mobile menu and search menu, plus the landing colour block in `src/index.css`.
Guardrail tests gain new rules for the label cap, the single button label and the long-dash
ban, so none of it creeps back.

Verification: full test suite, screenshots at phone and desktop widths, and a check that the
main button is visible without scrolling on a small phone.

**Two decisions from you: item 4 (logo strip) and whether lime gets one job or retires.**
