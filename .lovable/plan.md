# Landing page: founder section update

## What changes
- Remove the founder photo from the landing page's "From the founder" section.
- Change the founder name from "Asha Ps" to "Rahul Ps".

## How it looks after
The section becomes a single centred/left-aligned quote block: eyebrow ("From the founder"), the founder note, then the signature block reading "Rahul Ps — Founder, Ledge". No polaroid frame, no photo aura, no image column.

## Technical notes
- File: `src/components/landing/sections/Founder.tsx`
  - Delete the photo column (polaroid frame, LQIP blur layer, brass corners, photo parallax transform) and the `ashaPhoto` / `ashaPhotoBlur` imports plus the `loaded` state.
  - Collapse the 12-column grid to a single content column; keep the ambient wash and scroll-based fade-in so section motion stays consistent.
  - Update the signature name to "Rahul Ps".
- Image assets `src/assets/asha-ps-founder.webp` and `-blur.webp` are left in place (unused) unless you want them deleted too.
- No other page references the founder name; About Us contact details stay untouched.
