# Contact details update — new number, Rahul Ps, hello@getledge.in

Replace every public-facing contact detail with the new ones.

## Changes

**Phone number: +91 81380 84689 → +91 87142 49485** (and `918138084689` → `918714249485` in `tel:` / `wa.me` links)
- `index.html` — two JSON-LD `telephone` fields and the FAQ answer text
- `public/llms.txt` — two mentions
- `src/components/landing/sections/Footer.tsx` — tel link, displayed number, WhatsApp link
- `src/components/landing/sections/Pricing.tsx` — custom plan WhatsApp link
- `src/components/landing/sections/FinalCTA.tsx` — WhatsApp link (also change prefilled text "Hi Asha" → "Hi Ledge")
- `src/components/landing/NavCommandPalette.tsx` — call item, displayed number, WhatsApp link
- `src/components/landing/MobileWhatsAppFab.tsx`
- `src/components/landing/MobileStickyCtaBar.tsx`
- `src/pages/Contact.tsx` — SEO description text

**Name:** any "Asha Ps" wording becomes "Rahul Ps" (the founder signature already reads Rahul Ps; only the WhatsApp prefill still says Asha).

**Email: ashaoviyaps@gmail.com → hello@getledge.in**
- `src/pages/TermsOfService.tsx`, `src/pages/PrivacyPolicy.tsx`, `src/pages/RefundPolicy.tsx`, `src/pages/Contact.tsx`, `src/pages/AboutUs.tsx` (both display text and `mailto:` links)

**LinkedIn:** remove the LinkedIn icon/link from the footer social row (drop the unused `Linkedin` import).

## Notes

- Content/text only — no layout, backend, or design changes.
- Existing tests and build are re-run after the edits; publish is needed for the live site to pick this up.
