

# Create Contact Us Page

## Overview
Create a simple Contact Us page following the exact same pattern as Privacy Policy (Navbar + centered content + Footer).

## Files to Change

| Action | File | What |
|--------|------|------|
| Create | `src/pages/Contact.tsx` | Contact page with Navbar, content, Footer — same wrapper as PrivacyPolicy |
| Edit | `src/App.tsx` | Add `/contact` route |
| Edit | `src/components/landing/sections/Footer.tsx` | Link "Contact" to `/contact` using `<Link>` |

## Content (`Contact.tsx`)
- Same shell: `min-h-screen bg-white`, Navbar, `max-w-3xl mx-auto px-6 pt-28 pb-20`, Footer
- H1: "Contact Us"
- Body paragraph: "Have a question, need support, or want to see Ledge in action? We would love to hear from you."
- Email line: bold "Email us at:" with a `mailto:` link to `ashaoviyaps@gmail.com`
- Response time note: "We typically respond within 1–2 business days."

## Footer Update
Add conditional for "Contact" link → `<Link to="/contact">`, same pattern as the other links.

