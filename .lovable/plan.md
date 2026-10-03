# Diagram set: why Ledge runs on Lovable

Make a set of polished diagrams in the same style as the earlier four. They will be landscape, 1920x1080, in Ledge's black-and-white look with one accent colour.

## The images

1. **Side by side (the main one).** On the left, "Ledge on Lovable — fully managed". On the right, "Ledge self-hosted on AWS, DigitalOcean or similar — you manage it all".
   - Left: Ledge sits on one managed layer covering the AI gateway, Lovable Cloud (powered by Supabase: database, sign-in, file storage, server functions), analytics, agent integration, connectors, security scans, SEO and AI search. A prominent "SOC 2 Type II + ISO 27001" badge for Lovable sits beside it.
   - Right: the same list, broken into separate jobs the team must set up and look after: servers, the database and its backups, sign-in, AI provider keys and billing, monitoring, security patches, SEO tooling, deployments, compliance audits, and being on call.
   - Bottom line: "Early-stage? Spend time on customers, not servers."
2. **What Lovable handles for Ledge.** A hub diagram with Ledge in the centre and the 8 managed areas around it. Supabase is shown inside the Cloud area. Each area gets a one-line plain-words benefit.
3. **Where your data lives and how it is protected.** Layers from the user's phone, to the Ledge app, to Lovable (SOC 2 Type II, ISO 27001), to Lovable Cloud on Supabase, to the database, on top of secure cloud infrastructure. Ledge's own protections go on the matching layers: sign-in, per-business data walls (every business sees only its own data), role permissions, server-side money rules, locked GST bills, an audit trail, and backups.
4. **Effort and cost at a glance (optional).** A simple comparison table: time to launch, people needed, monthly upkeep, compliance work and risk, with "With Lovable" vs "Self-hosted".

## Accuracy rules

- Lovable's SOC 2 Type II and ISO 27001:2022 come from Lovable's published security announcement. The badge names Lovable, not Ledge: Ledge itself is not certified, so no image will say "Ledge is SOC 2 certified".
- No other unconfirmed numbers or claims, such as uptime percentages or "bank-grade".
- Hosting examples are AWS and DigitalOcean, plus "and similar". Your message said "Senders", which I couldn't place. If you meant another platform, such as Vercel, tell me and I'll add it.
- After the images are made, I check each one for spelling and wrong claims. Any image with a mistake gets redone before you see it.

## Delivered

PNG files saved to your Files, shown in chat. I also send you a short caption for each, for use in decks or social posts.

## Technical details

- Use the premium image model (best at legible text), 1920x1080, with prompts that spell out every label word for word.
- Look at each image after it's made, and redo or edit any image whose text or claims are wrong.
- No app code changes.
