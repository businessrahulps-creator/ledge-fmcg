# Ledge User Manual (Markdown, English, text only)

## Goal
One complete, professional user manual for Ledge, written so a 12-year-old can follow it. Delivered as a single Markdown file you can take to ChatGPT for design. No app changes.

## How it gets written
1. Walk the whole signed-in app (every page in the menu, every button, dialog, status and rule) plus the sign-up and team-invite flows, using the code and the sample business as the source of truth.
2. Write each chapter in plain words, following the approved word list (Unpaid amount, Sent, Godowns, Offers & schemes, Purchase bill, etc.).
3. Astra reviews the full draft twice: once for "can a 12-year-old follow this?" and once for accuracy against how the app really works (money rules, stock rules, who can do what). I fix every real issue it flags.
4. Final read-through to make sure nothing in the app is missing from the manual.

## Chapters
1. **Welcome** — what Ledge is, who it is for, the words you will see (dealer, godown, GST bill, credit note).
2. **Getting started** — sign up (Google or email), name your business, your role, logo, first look around, phone vs computer.
3. **First-time setup checklist** — business and GST details, godowns, products and prices, dealers and credit limits, salespeople, offers & schemes, inviting your team.
4. **Finding your way** — menu, top bar, bell, profile menu, search (Cmd+K), keyboard shortcuts.
5. **Dashboard and Today's work** — what each number means, how the work cards are chosen, marking cards handled, promised payments.
6. **Orders, start to finish** — book an order, advance payment, editing rules, dispatch & bill, stock and credit checks, mark delivered, cancel, delete, duplicate-save protection.
7. **GST bills and money** — bills, why bills can't be changed (credit notes only), recording payments, part payments, paying more than owed (you choose), refunds, dealer credit, unpaid amount and how old it is.
8. **Returns and credit notes**.
9. **Dealers** — profile, balance, credit limit, statement, scorecard.
10. **Stock and godowns** — products, stock levels, low-stock alerts, how stock goes down and comes back.
11. **Buying** — suppliers, purchase bills, returns to supplier, paying suppliers, money you owe.
12. **Shop visits** — logging visits, new shops, turning a shop into a dealer, promises to pay.
13. **Sales team and targets**.
14. **Reports and downloads** — each report, date ranges, PDF/Excel, Tally export.
15. **Team and access** — roles (owner, manager, accountant, salesperson, viewer), what each can see, giving extra access, invites, changing roles.
16. **Activity history and the bell** — what gets recorded, filters, downloads, who gets which alerts.
17. **Settings and company details**.
18. **Rules Ledge always follows** — a plain list of the money, stock and safety rules.
19. **FAQ** — 60+ real questions ("I made a mistake on a bill", "Why can't I send this order?", "Where did my stock go?").
20. **Troubleshooting** — common messages and what to do.
21. **Glossary** — every word, explained simply.

## Deliverable
- `/mnt/documents/ledge-user-manual.md` — one file, clear headings, numbered steps, short tip and warning boxes, table of contents.

## Technical details
- Source: src/pages, src/components, nav-config, intelligence.ts, receivables/payables libs, RPC rules and capability list.
- Astra via AI gateway (openai/gpt-6-astra) from /tmp scripts; draft sent in chapter batches.
- Pricing/plan wording kept generic unless confirmed (trial = 30 days).
