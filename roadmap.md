# Roadmap

## Arc free components rollout (no paid/Pro parts; built into Ledge's own primitives)
- [x] Button: press scale + `loading` spinner
- [x] UsageMeter on dealer page (credit limit used)
- [x] New primitives: CopyButton, HoldToConfirm, Sparkline, UsageMeter, SegmentedControl, AnimatedCounter (existing animated-number)
- [x] CopyButton on dealer phone
- [ ] CopyButton on GSTIN / bill numbers
- [x] `loading` on Save order
- [x] `loading` on Record payment, Cancel payment, and every "Saving…" button (dealers, team, products, godowns, stock, order edit)
- [x] Send on WhatsApp is instant — no spinner needed
- [ ] HoldToConfirm on Cancel order / Void bill (reason + audit stay)
- [ ] My Business metrics-dashboard style top (tile tabs + chart + compare)
- [ ] Phone forms: combobox, date range, bottom sheet, swipe actions
- [ ] Desktop filter toolbar + sortable tables (Orders, Bills, Dealers, Stock)
- [x] Verified dealer page (copy + credit bar) in demo business (signed in as asha@getledge.in)
- [ ] Astra review per phase

## Plain language
- [ ] Empty screens, error/success messages, "?" hints

## Calculation integrity (Astra deep review, Oct 2026)
- [x] Stock low count per product; Reference hidden on Cash; clearer sort arrows; unpaid-by-age gap explained
- [x] Returns: same bill line twice rejected
- [x] Sales trend excludes cancelled, subtracts offers
- [ ] New-order offer preview must match server (non-combinable pick, repeated product lines) — needs OK
- [ ] Product-specific discounts spread across other GST rates on bill — needs OK (changes future bills)
- [ ] Credit check / advance cap use pre-GST value — needs OK
- [ ] Split returns can leave ₹1 rounding owed
- [ ] Custom date range starts 05:30 IST; comparison windows overlap
- [ ] 192 legacy 13-Apr bills: header tax rounded to rupee (grand totals correct; bills immutable — leave)
- [ ] 225 stock rows: opening stock never recorded in history (add opening entries, quantities unchanged)
