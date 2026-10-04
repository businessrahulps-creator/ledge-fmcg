# Bots across the landing page

Give the landing page a cast of small, colourful helper bots so Ledge feels like a team of AI helpers working for the distributor. Each bot appears once only, and each has one job tied to the section it sits in. The rest of the page stays black and white, so the bots become the only colour and stand out on purpose.

## The rule
- One bot per moment, never the same shape twice on the page (the library has 18 shapes).
- Every bot does one job that matches its section: an orders bot, a payments bot, and so on. No random decoration.
- Bots stay small (28–56px) and sit next to headings or inside cards. They don't replace your words, images or prices.
- They stay calm, following the motion rules: slow looks around, no constant jumping (idle jumps off), "working" only where something is happening. When a phone asks for less motion, they stand still.
- The five bots used for job roles inside the app (square, circle, triangle, drop, pebble) appear only in the Team moment, so the landing page matches what owners see after signing up.

## Where they go (draft; Astra and Fable will refine it)
| Section | Bot | Job |
|---|---|---|
| Hero diagram | star (working) | Sits on the "Ledge" centre box, works when each story passes through |
| Trust bar | cloud (sleeping) | Peacefully "always on" next to the customer names |
| Problem | ghost | The "lost money / missing stock" problem, looking worried |
| How it works (3 steps) | clover, flower, hexagon | One per step: take order, send bill, collect money |
| Features | droid, mech, cat, pill | One per feature card: orders, godown, payments, claims |
| Ledge Co-Pilot (dark) | alien (working, with headphones) | The Co-Pilot itself |
| Who it's for / Team | square, circle, triangle, drop, pebble | Owner, Manager, Accountant, Sales rep, Viewer, matching the app |
| Pricing | blob (Free), puddle (Growth); Scale gets a crown on star? No, no repeats: Scale has no bot | One per plan |
| FAQ | (none) | Keep it quiet |
| Final call to action | all-shapes? No: a single wave from the remaining shape | Sign-off |

Astra (high reasoning) will review every section for fit and clutter, and Fable 5.1 will review screenshots frame by frame. Bots that don't earn their place get cut. The final table will have no repeats.

## Checks
- Screenshots on phone, tablet and computer; nothing spills off or covers text.
- Page speed: bots load only when scrolled into view and pause off screen. We'll also check the page still opens quickly.
- Reduced motion shows still bots.
- A test that fails if the same bot shape appears twice on the landing page.

## Technical details
- `bot-avatars` is already installed (used by `RoleBot.tsx`). New `src/components/landing/LandingBot.tsx` wraps `BotAvatar` with `React.lazy` + an IntersectionObserver mount, `interactive` on (desktop), `jumpEvery={0}`, a seeded `seed`, `shading="fabric"`, and `aria-hidden` when decorative.
- A single `LANDING_BOTS` map (section → type) in `src/components/landing/bots.ts`; the uniqueness test reads it.
- Hero: overlay the bot in `LedgeFlowHub` hub node, `state` driven by the existing phase clock (no extra rAF).
- The monochrome test gets an exception for bot canvases only; the page itself stays black and white with no colour fades.
- Update `src/components/landing/AGENTS.md` with the one-bot-per-shape rule.
