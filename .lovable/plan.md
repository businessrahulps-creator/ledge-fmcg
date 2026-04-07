

# Add Privacy Policy Page

## What We'll Do

Create a dedicated `/privacy-policy` page with the Navbar and Footer from the landing page, displaying the provided privacy policy content in a clean, readable layout. Then update the Footer to link "Privacy Policy" to this new route.

## Files to Change

| Action | File | What |
|--------|------|------|
| Create | `src/pages/PrivacyPolicy.tsx` | New page with Navbar + Footer wrapping the privacy policy content, styled with proper typography (headings, paragraphs, lists, dividers) matching the landing page aesthetic |
| Edit | `src/components/landing/sections/Footer.tsx` | Update the "Legal" column to use `<Link to="/privacy-policy">` for the Privacy Policy item instead of `href="#"` |
| Edit | `src/App.tsx` | Add `<Route path="/privacy-policy" element={<PrivacyPolicy />} />` |

## Design Approach

- Reuse `<Navbar />` and `<Footer />` from the landing sections for consistent header/footer
- Content area: `max-w-3xl mx-auto px-6 py-24` with proper spacing
- Headings use `font-heading text-midnight`, body uses `font-body text-graphite`
- Horizontal rules between sections using `border-fog`
- Lists styled with bullet points and proper indentation
- Bold text for emphasis (email addresses, key terms)
- `scroll-smooth` on wrapper like the landing page

