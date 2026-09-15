# Fix the blocked bill viewer

## What is broken
The bill file is generated correctly, but the bill page places its temporary PDF URL inside a browser frame. Chrome is blocking that frame, which is why **Download** works while **View Bill** shows “This page has been blocked by Chrome.”

## Plan
1. Replace the browser PDF frame with an in-app PDF renderer that draws every bill page directly on screen.
2. Keep the existing bill page and its **Download**, **Print**, **WhatsApp**, and **Close** actions; make Print use the rendered bill page rather than the blocked frame.
3. Apply the same renderer to the existing bill-preview window so this failure cannot reappear through another billing action.
4. Add clear preparing, failure, and retry/download states, with page-width fitting on desktop and mobile.
5. Verify with the seed account from both **Money to collect** and **Documents**:
   - View Bill displays the actual bill instead of Chrome’s blocked-page message.
   - Multi-page bills render every page.
   - Download still produces the valid PDF.
   - Print opens correctly.
   - WhatsApp and Close remain functional.
6. Run the focused tests, full test suite, and production build, then check desktop and mobile layouts in Chrome.

## Technical details
Use a browser-side PDF rendering library to render the existing generated PDF blob onto canvases. This avoids Chrome’s built-in PDF plug-in and blob-frame restrictions while preserving the immutable PDF as the source for viewing and downloading. Keep bill generation and accounting data unchanged.
