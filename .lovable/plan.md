

# Landing Page Copy Replacement

## Summary
Replace all textual content across 10 landing page section components with the exact new copy provided. No structural, layout, animation, or styling changes.

## Files to modify (text-only changes)

### 1. `src/components/landing/sections/Navbar.tsx`
- CTA button text: "Start Free Trial" → "Get Started Free" (lines 61, 92)

### 2. `src/components/landing/sections/Hero.tsx`
- Headline (line 135): → "Every order your team placed today. Do you actually know about it?"
- Subheadline (lines 142-144): → new longer paragraph about complete distribution management platform
- Primary CTA (line 152): "Start Free Trial" → "Get Started Free"
- Secondary CTA (line 158): "Watch a 2-Minute Demo" → "See How It Works"
- Social proof line (line 166): → "Used by FMCG distribution businesses across India to replace spreadsheets, WhatsApp threads, and ERPs their teams hated."
- Dashboard mockup KPIs (lines 15-18): Update values to ₹12,47,000 / 23 / 16 / 53% delivered
- Dashboard mockup orders (lines 22-24): Keep same structure, can stay as-is (mockup visual placeholder matches)

### 3. `src/components/landing/sections/TrustBar.tsx`
- Companies array (lines 22-28): → "Aryan Beverages", "Nova Retail Co.", "Coastal Naturals", "Horizon Foods", "Sterling FMCG", "Crest Agencies"
- Stats section: Replace numeric `StatBlock` components with 3 simple text blocks: "₹0 setup cost", "4 user roles built-in", "Works offline on any phone" (these are not numeric count-ups, so replace with plain `AnimateIn` divs)
- Pull quote (lines 59-63): Replace quote text and attribution with new Arnav Sethi quote

### 4. `src/components/landing/sections/Problem.tsx`
- Section headline (line 39): stays the same ✓
- Card titles and descriptions (lines 5-28): Replace all 4 cards with new headlines and longer body copy

### 5. `src/components/landing/sections/HowItWorks.tsx`
- Section headline (line 165): → "Three things happen when your team uses Ledge. All of them in under sixty seconds."
- Step badges (lines 136, 143, 150): "Step 1/2/3" → "01/02/03"
- Step titles and descriptions: Replace all 3 with new copy
- Mockup content stays unchanged (visual placeholders)

### 6. `src/components/landing/sections/Features.tsx`
- Section headline (line 49): → "Built for the way Indian distribution businesses actually run. Not for how someone in a boardroom imagined they do."
- All 6 feature card titles and descriptions: Replace with new copy

### 7. `src/components/landing/sections/WhyOrdra.tsx`
- Section headline (line 31): → "This isn't another ERP your field team will quit in three weeks."
- All 4 blocks: Replace titles and content with new copy

### 8. `src/components/landing/sections/Testimonials.tsx`
- Section headline (line 35): → "From owners who stopped guessing."
- All 4 testimonial quotes, names, and roles: Replace with new copy

### 9. `src/components/landing/sections/Pricing.tsx`
- Section headline (line 74): → "Start free. Pay when it's running your business."
- Section subheadline (line 78): → "No setup fees. No annual lock-in. Cancel anytime. Every plan includes PWA install, offline support, and automatic updates."
- All 4 plan features arrays: Replace with new detailed feature lists
- Plan taglines: Add tagline text below plan names (requires adding a `tagline` field)
- CTA text updates: "Start Free" stays, "Start 14-Day Trial" → "Start 14-Day Free Trial"
- Footer note (lines 148-153): → "All plans include offline support, PWA install, automatic updates, and role-based access control. · Need help deciding? Chat on WhatsApp →"

### 10. `src/components/landing/sections/FinalCTA.tsx`
- Headline (line 11): → "Your team is in the field right now. Orders are moving. Are you watching?"
- Subheadline (line 16): → "Set up Ledge in under 15 minutes. See your first live order before the hour is up. No credit card. No IT department. No onboarding call."
- CTA button (line 24): "Start Free. Takes 2 Minutes" → "Get Started Free"

### 11. `src/components/landing/sections/Footer.tsx`
- No text changes needed — columns and copyright already match ✓

## Technical notes
- TrustBar `StatBlock` components will be replaced with simple `AnimateIn` text divs since the new stats are not numeric
- Pricing cards will get a `tagline` string field added to the `plans` data array
- Hero dashboard mockup KPI values update to match the new copy's numbers
- All changes are purely to string literals in data arrays and JSX text nodes

