

# Add Refund Policy Page

Same pattern as Privacy Policy and Terms of Service.

## Files to Change

| Action | File | What |
|--------|------|------|
| Create | `src/pages/RefundPolicy.tsx` | New page with Navbar + Footer, all refund policy content styled identically to Privacy Policy |
| Edit | `src/App.tsx` | Add route `/refund-policy` |
| Edit | `src/components/landing/sections/Footer.tsx` | Update "Refund Policy" link to use `<Link to="/refund-policy">` |

