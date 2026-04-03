

# Remove Em Dashes, "Book a 15-Min Walkthrough" Button, and Trust Badges

## Changes

### 1. FinalCTA.tsx
- Remove "Book a 15-Min Walkthrough" `<a>` button entirely
- Remove the entire badges array and the `<div>` rendering them (Bank-grade encryption, Works on any phone, Data stored in India, Go live today)
- Replace em dash in CTA text: `"Start Free — Takes 2 Minutes"` → `"Start Free. Takes 2 Minutes"`

### 2. Hero.tsx (line 172)
- `"every rupee — live on your dashboard"` → `"every rupee, live on your dashboard"`

### 3. Features.tsx
- Line 9: `"spot patterns — maybe Tuesdays"` → `"spot patterns. Maybe Tuesdays"`
- Line 15: `"confirms pricing — done in under"` → `"confirms pricing. Done in under"`
- Line 19 (title): `"Every dealer, every salesperson — one tap"` → `"Every dealer, every salesperson, one tap"`
- Line 27: `"Health badges — Healthy (green)"` → `"Health badges: Healthy (green)"`
- Line 33: `"cheque, credit — tracked how"` → `"cheque, credit. Tracked how"`
- Line 39: `"connectivity returns — auto sync"` → `"connectivity returns, auto sync"` and `"bolted on. It's the foundation."` (no change needed there)

### 4. Problem.tsx (line 21)
- `"don't care — because your"` → `"don't care. Because your"`

### 5. HowItWorks.tsx
- Line 119: `"their phone — it works like"` → `"their phone. It works like"`
- Line 127: `"the weather — just open"` → `"the weather. Just open"`

### 6. WhyOrdra.tsx
- Line 17: `"Offline-first isn't a feature we added — it's the foundation"` → `"Offline-first isn't a feature we added. It's the foundation"`
- Line 12: `"₹8,000 Redmi"` has no em dash (fine)

### 7. Testimonials.tsx
- Line 6: `"7pm — 'kitne order"` → `"7pm, 'kitne order"`
- Line 18: `"godown — 3 days before"` → `"godown, 3 days before"`
- Line 24: `"bhejta tha — net nahi"` → `"bhejta tha, net nahi"`

### 8. TrustBar.tsx
- Line 60 (pull quote): `"week — dealer-wise"` → `"week, dealer-wise"`

### 9. Also check JSX comments with em dashes
- These are code comments (`{/* Left — Text */}` etc.) and won't render. No change needed for those.

## Summary
- Replace all visible em dashes (—) with periods, commas, or colons depending on context
- Remove the "Book a 15-Min Walkthrough" secondary button from FinalCTA
- Remove the 4 trust badge pills from FinalCTA
- **8 files** edited, no structural/layout changes

