

# Fix Trial Period: 14 days → 30 days

All references to "14-day free trial" across the marketing site need to be updated to "30-day free trial".

## Changes (7 files)

### 1. `src/components/landing/sections/Pricing.tsx`
- Line 46: `"Start 14-Day Free Trial"` → `"Start 30-Day Free Trial"`
- Line 68: `"Start 14-Day Free Trial"` → `"Start 30-Day Free Trial"`

### 2. `src/components/landing/FinalCTA.tsx` (old component)
- Line 34: `14 days free` → `30 days free`

### 3. `src/components/landing/HeroSection.tsx` (old component)
- Line 165: `14-day free trial` → `30-day free trial`

### 4. `src/components/landing/PricingSection.tsx` (old component)
- Line 9: `"for 14 days"` → `"for 30 days"`
- Line 45: `Start free for 14 days` → `Start free for 30 days`

### 5. `src/pages/TermsOfService.tsx`
- Line 49: `14-day free trial` → `30-day free trial`
- Line 98: Keep "14 days' notice" — this is about legal notice period, not trial

### 6. `src/pages/RefundPolicy.tsx`
- Line 27: `14-day free trial` → `30-day free trial`

### 7. `src/pages/PrivacyPolicy.tsx`
- Line 85: Keep "14 days" — this is about policy change notice period, not trial

### 8. `src/pages/Signup.tsx`
- Line 80: Already says "30-day free trial" — no change needed

Simple find-and-replace across 6 files. No structural changes.

