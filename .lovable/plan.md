

# Fix Footer Feature & Pricing Links

## Problem

The "Features" and "Pricing" links in the footer use `/#features` and `/#pricing` with React Router's `<Link>` component. Since the user is already on `/`, React Router navigates to `/` but does **not** scroll to the anchor — it treats the hash as a route change, not a scroll target.

## Solution

For these two links, instead of `<Link>`, use a plain `<a href="#features">` / `<a href="#pricing">` tag when the link starts with `/#`. This lets the browser handle native anchor scrolling. For links to other pages (`/about-us`, `/contact`, etc.), keep using `<Link>`.

## Changes

**File: `src/components/landing/sections/Footer.tsx`**

- Update the render logic inside the `col.links.map()` to check if `linkMap[link]` starts with `/#`
- If yes, render a plain `<a>` tag with `href` set to the hash portion (e.g. `#features`)
- If no, render the existing `<Link>` component
- Same styling on both

This is a single-file, ~10-line change.

