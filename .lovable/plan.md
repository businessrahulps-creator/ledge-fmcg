# Living Shader Backdrop for Hero + Final CTA

The dark sections look dull because they are static CSS gradients with a fixed noise tile — no depth, no motion, no reaction to the cursor. The fix is a real shader canvas behind those two sections.

## About vgpu

vgpu (the site you found) is a WebGPU library. WebGPU today does not run in Firefox stable, older Safari, or a large share of the mid-range Android phones your South India users carry — on those devices the hero would fall back to the same dull gradient. So: same visual language, built on WebGL2, which runs essentially everywhere, with a CSS fallback only for the tiny remainder. Nothing about the look is compromised; only the API underneath changes.

## What gets built

A `ShaderBackdrop` canvas component (single fragment shader, no library, ~4 KB, no new dependency) mounted behind the Hero and the Final CTA:

- Deep charcoal-to-black field with a slow-drifting light pool toward the upper right, so the black reads as lit metal instead of flat paint.
- Fine animated film grain in the shader itself (replaces the static SVG noise tile).
- Very slow domain-warped flow — movement you feel rather than notice, roughly a 30-second loop.
- A single restrained Electric bloom that reacts to cursor position on desktop, drifting on its own on mobile.
- Vignette so the headline and CTA sit on the darkest area with strong contrast.

Two presets from the same shader: Hero (taller, more light, more motion) and Final CTA (tighter, calmer, dimmer) so the two dark anchors feel related but not duplicated.

## Performance and safety rails

- Renders only while the section is on screen (IntersectionObserver), pauses when the tab is hidden.
- Capped at 30 fps and DPR 1.5; no render loop while offscreen.
- `prefers-reduced-motion`: one static frame, no animation.
- No WebGL2 context (very old device): the current CSS graphite gradient stays as the fallback — nothing breaks.
- Text, buttons, and mockups stay exactly where they are; only the background layer changes.

## Technical notes

- New: `src/components/landing/visuals/ShaderBackdrop.tsx` plus the WGSL-equivalent GLSL kept inline in that file.
- `src/index.css`: `.lp-block-graphite` keeps its colours as the fallback ground; its static noise `::before` is dropped when the canvas mounts.
- `Hero.tsx` and `FinalCTA.tsx` each render `<ShaderBackdrop preset="hero" | "cta" />` as the first child; existing content keeps `z-index: 1`.
- `/app` and every light section are untouched.
- Verification: 390 / 768 / 1440 screenshots, full Vitest, fresh build, and a frame-time check so the hero stays smooth on a throttled CPU.
