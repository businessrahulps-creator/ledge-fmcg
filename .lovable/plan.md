

# Create About Us Page

## Overview
Create a dedicated About Us page following the exact same pattern as Privacy Policy / Terms of Service pages (Navbar + content + Footer), but with a more visually rich layout befitting an "About" page — a hero-style header section with subtitle, content sections with subtle Lucide icons, and a prominent CTA button. Then wire it up in the router and footer.

## Files to Change

| Action | File | What |
|--------|------|------|
| Create | `src/pages/AboutUs.tsx` | Full About Us page |
| Edit | `src/App.tsx` | Add `/about-us` route |
| Edit | `src/components/landing/sections/Footer.tsx` | Link "About Us" to `/about-us` |

## Page Structure (`AboutUs.tsx`)

Uses Navbar + Footer wrapper, same as PrivacyPolicy. Content sections:

1. **Hero header** — centered, with `font-heading font-extrabold text-4xl md:text-5xl text-midnight` title and `text-graphite text-lg` subtitle. Light cream/snow background band to distinguish from body.

2. **Content sections** — each with a Lucide icon (e.g., Building2, Target, Users, Shield, Mail), section title (`font-heading font-bold text-xl`), and body text (`text-graphite leading-relaxed`). Sections separated by `hr.border-fog`. Sections:
   - About Us (intro paragraphs)
   - What We Do
   - Who We Built This For
   - Our Commitment
   - Get in Touch — includes email/website info plus a prominent `mailto:` CTA button styled as `bg-ink text-white rounded-full` (matching existing CTA buttons)

3. **Motion animations** — subtle `framer-motion` fadeUp on hero text, matching the landing page feel.

## Footer Update

Add a condition for "About Us" link → `<Link to="/about-us">`, same pattern as the legal page links.

## Routing

Import `AboutUs` and add `<Route path="/about-us" element={<AboutUs />} />` alongside the other public routes.

