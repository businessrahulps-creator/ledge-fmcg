# Fix the blocked bill viewer

## What is broken
The bill file is generated correctly, but the bill page places its temporary PDF URL inside a browser frame. Chrome is blocking that frame, which is why **Download** works while **View Bill** shows “This page has been blocked by Chrome.”

## Plan
1. Remove the bill page and blocked embedded viewer that were added in the previous attempt.
2. Make **View Bill** open the generated PDF directly using the same proven file path as **Download PDF**. No modal, wrapper page, or new viewer.
3. Keep **Download PDF**, **Open order**, and **Remind on WhatsApp** unchanged.
4. Verify the exact action from both **Money to collect** and **Documents** using the seed account: clicking **View Bill** must open the real GST bill and never show the custom page or Chrome’s blocked-frame message.
5. Run the existing tests and production build.

## Technical details
Reuse the already-working generated PDF blob and open it directly from the click action. Do not add a PDF renderer, route, modal, or accounting change.
