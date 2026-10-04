# Live "how Ledge works" picture in the top section

Replaces the "Sample day" card beside the headline with an animated hub diagram in the style of your first screenshot: a soft grey panel, white boxes, thin curved lines, and small dots moving along them. Black, white and grey only.

## What it shows (the real Ledge flow)

```text
 Sales rep  (order booked) ─╮                 ╭─ Godown   (stock deducted)
 Dealer     (payment in)  ──┼──  [ Ledge ]  ──┼─ GST bill (CGST + SGST)
 Return     (claim raised) ─╯   1,284 today   ╰─ Owner    (dashboard updated)
```

One loop, about 9 seconds, with four stories playing in turn:
1. **Order:** a dot leaves *Sales rep* and goes into Ledge. Ledge pulses once, then dots go out to *Godown* (the stock number ticks down) and *GST bill*.
2. **Payment:** a dot leaves *Dealer* and goes into Ledge, then out to *Owner*. The amount collected updates.
3. **Claim:** a dot leaves *Return* and goes into Ledge, then out to *GST bill* (credit note) and *Godown* (stock back in).
4. The counter under Ledge ("1,284 processed today") goes up after each story.

The box that is working shows a short status under its name, for example "Order ORD-1042", "₹38,420 received" or "Credit note issued", then settles back. Each line darkens briefly while its dot travels.

## Motion quality
- Smooth, continuous movement at 60 frames per second. Dots glide along the curves with an ease-in-out, and boxes respond with a soft border and shade change. No bounce, blur or flicker, so it matches the calm feel of the rest of the page.
- Sharp at every size: built as drawn shapes and real text, not an image or video, so it stays pin-sharp on retina screens.
- Pauses when scrolled out of view or when the browser tab is hidden. People who switch off motion see the finished picture with no movement.
- On phones the layout stacks tighter: three boxes on each side shrink to icon plus name, and Ledge stays in the middle.

## How Fable 5.1 is used
I'll ask Fable 5.1 to design the exact motion timeline: path shapes, dot timing, the order of the stories and status wording. It will also review the finished screen recordings frame by frame for glitches. I'll build to its timeline, then do two rounds of Fable review on the recordings and fix what it finds.

## Technical details
- New `src/components/landing/visuals/LedgeFlowHub.tsx`: SVG (cubic Béziers) for lines plus HTML node cards positioned on a fixed 560×420 design grid, scaled with the container.
- Dots animate with `motion` `animate()` driving `offset-path`/`getPointAtLength` in a single rAF timeline (`useAnimationFrame`), so the loop never drifts. Line highlight uses `pathLength`. Card status uses a crossfade.
- `useInView` plus `document.visibilitychange` pause the loop. `useReducedMotion` renders a static end state.
- Icons from lucide (UserRound, Store, RotateCcw, Warehouse, FileText, LayoutDashboard), using mono tokens from `ledge-mono.css`.
- `Hero.tsx`: swap `LiveFeed` for `LedgeFlowHub` and delete the old feed code.
- Fable is called via `anthropic/claude-fable-5-1` on messages (allowed by workspace retention), with the screenshots and recorded frames from Playwright (`page.video`) at 1280 and 390 widths.
- Run the full test suite afterwards.
