## Goal
Remove every em-dash (`—`) from the landing page and rewrite affected sentences in clean, confident, Apple-style prose: short, definitive, period-separated.

## Scope
- Em-dashes (`—`) only. Numeric en-dashes (`–`) in ranges like `5–10%`, `₹10L–₹1Cr`, `2–3 hrs` stay — that's correct typography for ranges (Apple does the same).
- Comments in code (e.g. `DeviceFrames.tsx` line 94) stay as-is.

## Exact rewrites

### `index.html`
- Title (×3 places): `Ledge — The Operating System for Factory + Field` → **`Ledge. The Operating System for Factory and Field.`**
- Description (×3 places): `Ledge runs your factory and your field on one mobile app — orders, stock, payments, GST, production. Built for ambitious Indian business owners.` → **`Ledge runs your factory and your field on one mobile app. Orders, stock, payments, GST, production. Built for ambitious Indian business owners.`**

### `src/components/landing/sections/Hero.tsx` (line 49)
- `Orders, payments, stock, GST invoices, production — one mobile app.` → **`Orders, payments, stock, GST invoices, production. One mobile app.`**

### `src/components/landing/sections/Founder.tsx` (lines 48, 50)
- `…juggle a factory on one side and a field team on the other — with software that ignored both.` → **`…juggle a factory on one side and a field team on the other. The software ignored both.`**
- `…a system that keeps up — built in India, designed for the way you actually work.` → **`…a system that keeps up. Built in India. Designed for the way you actually work.`**

### `src/components/landing/sections/HowItWorks.tsx` (line 43)
- `Revenue, dispatches, outstanding — moving in real time. No evening summary call.` → **`Revenue, dispatches, outstanding. Moving in real time. No evening summary call.`**

### `src/components/landing/sections/WhyOrdra.tsx` (line 8)
- `Owner, manager, accountant, salesperson — each sees what they should.` → **`Owner, manager, accountant, salesperson. Each sees what they should.`**

### `src/components/landing/sections/Outcome.tsx` (line 7)
- `Sales lift — same team, same dealers` → **`Sales lift. Same team, same dealers.`**

### `src/components/landing/sections/Problem.tsx` (lines 10, 25)
- `Voice notes, paper chits, four phone calls — and you still don't know what sold today.` → **`Voice notes, paper chits, four phone calls. You still don't know what sold today.`**
- `Tally, SAP — built for desktops. Your field team gave up by week two.` → **`Tally and SAP were built for desktops. Your field team gave up by week two.`**

### `src/components/landing/sections/FinalCTA.tsx` (line 49)
- `Just clarity — from day one.` → **`Just clarity. From day one.`**

### `src/components/landing/sections/Features.tsx` (lines 6, 8, 9, 10)
- `Today's revenue, orders, dispatches — the moment you log in.` → **`Today's revenue, orders, dispatches. The moment you log in.`**
- `Lifetime value, outstanding, full history — one profile.` → **`Lifetime value, outstanding, full history. One profile.`**
- `Green, amber, red — per SKU, per godown. Never face a stockout.` → **`Green, amber, red. Per SKU, per godown. Never face a stockout.`**
- `Cash, UPI, cheque, bank — all reconciled in one place.` → **`Cash, UPI, cheque, bank. All reconciled in one place.`**

### `src/components/landing/sections/Pricing.tsx` (line 33)
- `Payment tracking — all modes` → **`Payment tracking, all modes`**

## Not changing
- Numeric ranges with en-dash `–` (Hero "5–10%", Outcome "₹10L–₹1Cr" / "8–12%" / "₹10K–₹20K", TrustBar "2–3 hrs" / "15–20 hrs", Pricing "₹5,000–₹15,000+"). These are typographically correct ranges, used by Apple themselves.
- Code comments containing `—`.
- Any layout, visuals, components, or routing.

## Verification
- `rg "—" src/components/landing/ index.html` returns only the `DeviceFrames.tsx` comment afterward.
- TypeScript check passes.
