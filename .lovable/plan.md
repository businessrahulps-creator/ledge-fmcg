## Plan: Landing image speed optimization

### Goal
Reduce landing page image payload and improve first-load speed without changing the landing design.

### What I’ll optimize
- Hero product screenshot: `hero-dashboard.webp`
- How-it-works screenshots: `step-orders.webp`, `step-stock.webp`, `step-billing.webp`
- Testimonial avatars: `testimonial-*.jpg`
- Founder image: `asha-ps-founder.webp`
- Repeated logo/watermark assets used on the landing page
- Small footer logo asset if it is unnecessarily heavy

### Implementation steps
1. **Generate compressed derivatives**
   - Use the existing `sharp` dependency to create optimized `.webp` assets.
   - Preserve visual quality with sane sizes:
     - Hero/product screenshots: resize to displayed max dimensions and compress around WebP quality 72–78.
     - Step screenshots: lower max width because they render smaller than the source dimensions.
     - Avatar photos: crop/resize to compact square WebP files.
     - Founder photo: create a right-sized portrait WebP.
   - Keep transparent/branding needs intact where relevant.

2. **Update landing imports and markup**
   - Replace JPG avatar imports with compressed WebP imports.
   - Point hero/step/founder/logo imports to optimized assets.
   - Keep `fetchPriority="high"` only on true above-the-fold images.
   - Ensure below-the-fold images stay `loading="lazy"` and use `decoding="async"`.

3. **Avoid accidental quality regressions**
   - Keep original source images in place as fallback/source assets unless we can safely replace them one-for-one.
   - Use explicit width/height dimensions to avoid layout shift.
   - Do not alter colors, layout, motion, or content.

4. **Validate output**
   - Compare before/after file sizes.
   - Inspect generated dimensions/formats.
   - Confirm imports resolve and the landing page still references the optimized images.

### Expected impact
- Testimonial avatars should drop sharply because current JPGs are much larger than needed for 48px display.
- Product screenshots should become smaller while remaining crisp.
- Landing image bytes should reduce meaningfully, especially for mobile visitors.