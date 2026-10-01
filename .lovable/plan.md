# UI/UX review: spacing, motion, menu and a pixel-by-pixel check

## Goal
Make every signed-in screen feel like one calm, professional SaaS product: the same spacing, the same motion and a menu grouped the way a distributor actually works. Keep every feature, page address, label meaning and business rule. Keep the white, black and grey look and the plain-language words.

## 1. Reviewers working in parallel
- **Astra, design system:** check spacing scale, type sizes, corner radius, borders, shadows, focus rings and colour use against the rules Ledge already follows.
- **Fable, motion:** check page changes, dialogs, sheets, toasts, loaders, press feedback and reduced-motion support.
- **Hands-on pixel pass:** screenshot every menu item on a phone (393 px) and a computer (1280 px) in loading, empty, filled and error states. Measure each screen against a checklist, with the results written down.
- **Menu reviewer:** map each menu item to the user's daily job and how often it gets used.

Each finding is ranked "must fix", "should fix" or "small", with the screen, the exact place and the fix.

## 2. Pixel checklist, every screen
- Page edges: 16 px on phone, 24 px on computer. One page title size. Sections spaced 24 px apart, cards 16 px apart inside.
- All spacing on a 4 px step. No odd gaps (13 px, 18 px).
- Tap targets at least 44 px on phone. Bottom bar clears the phone's home bar.
- Numbers line up in columns. Money is right-aligned in Indian format.
- One main button per card or dialog. Same wording for the same action everywhere.
- Text never cut off, wrapped badly or pushed sideways on a phone. Nothing ever scrolls sideways.
- Loading placeholders have the same shape as the content they replace. Empty screens say what to do next.
- One corner-radius rule, one border weight, one shadow scale.

## 3. Motion rules
- Moving between pages: a quick 150 ms fade, no sliding. Menu and header never re-animate.
- Dialogs and sheets: open in 200 ms or less with a strong ease-out, and close faster than they open.
- Buttons: a slight press-down on tap. List rows: a background highlight only.
- No animation on numbers people are reading, except the existing counters on first load.
- If the phone is set to reduce motion, everything becomes a simple fade.

## 4. Menu reorganisation (proposed)

```text
Work (daily)          Money                 Stock & buying        People               Insights
Home                  Money to collect      Stock                 Dealers              My Business
Today's work          Returns               Buying                Sales team           Reports
Orders                                      Offers & schemes      Targets
Shop visits
                                                          Bottom: Company, Settings
```

- Phone bottom bar stays at five buttons: Home, Orders, Today's work (or Stock for roles without money access), Money to collect (or Shop visits for salespeople), Menu.
- The Menu sheet uses the same groups and order as the computer menu, with a search box at the top.
- Items each role can't use stay hidden, as today.

## 5. Fix and verify
- Fix every "must fix" and "should fix" item. List anything that would change a feature for your decision.
- Re-screenshot every screen after the fixes and compare before and after.
- Keep all 366 checks passing. Close with a plain-words report and before/after screenshots.

## Technical details
- Spacing and motion tokens go in `src/index.css` and `tailwind.config.ts` (`--space-*`, `--ease-out-strong`, durations). Components use those tokens and never raw values.
- A shared `PageShell` / `PageHeader` handles page edges, title and section spacing on every page.
- Menu groups move into one shared nav config used by both `AppSidebar` and the `AppLayout` phone bar and sheet, so the two can't drift apart. Role and capability filtering stays as it is.
- Playwright scripts in `/tmp/browser/uiqa/` capture every route at both sizes, signed in as the demo owner, plus a check for sideways scroll and for tap targets under 44 px.
- Record the shared nav config rule in `AGENTS.md`. Save the final spacing and motion rules to memory.
