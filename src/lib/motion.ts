import type { RefObject } from "react";
import { useScroll, useTransform, useReducedMotion, type MotionValue, type Transition, type Variants } from "framer-motion";

/* ════════════════════════════════════════════════════════════════════
   Motion System v2 — "Choreographed Calm"
   A Fluent 2 + Material 3 Expressive hybrid.

     • Easings are brand assets. Use named curves, never `ease-out`.
     • Distance scales with rank. Lead > Support > Ambient.
     • Springs ONLY for direct manipulation (drag, tap, magnetic).
     • prefers-reduced-motion collapses everything to a 200ms fade.
   ════════════════════════════════════════════════════════════════════ */

/** Named cubic-bezier easings (Fluent 2 + M3 Expressive). */
export const ease = {
  /** Entrances — content arriving from off-stage. */
  decelerate:  [0.1, 0.9, 0.2, 1] as [number, number, number, number],
  /** Swaps / layout shifts — both arrival and departure. */
  standard:    [0.8, 0, 0.2, 1] as [number, number, number, number],
  /** Exits — content leaving. */
  accelerate:  [0.7, 0, 1, 0.5] as [number, number, number, number],
  /** Hero moments — M3 Expressive "emphasized". */
  emphasized:  [0.05, 0.7, 0.1, 1] as [number, number, number, number],
};

/** Duration scale (seconds). */
export const duration = {
  micro: 0.18, short: 0.28, medium: 0.42, long: 0.72, hero: 1.0,
};

/** Three motion ranks. Pick one per element; mixing is forbidden. */
export const rank = {
  /** Hero headlines, primary CTAs, marquee imagery. */
  lead:    { y: 36, blur: 12, scale: 0.96, duration: duration.long,   ease: ease.emphasized, stagger: 0.08 },
  /** Section headings, body cards, supporting copy. */
  support: { y: 16, blur: 4,  scale: 0.98, duration: duration.medium, ease: ease.decelerate, stagger: 0.05 },
  /** Pills, chips, micro-decorations. */
  ambient: { y: 6,  blur: 0,  scale: 1,    duration: duration.short,  ease: ease.decelerate, stagger: 0.03 },
} as const;

export type Rank = keyof typeof rank;

/** Springs ONLY for direct manipulation. Never use for entrances. */
export const physics = {
  /** Magnetic pull toward cursor. */
  magnetic: { type: "spring", stiffness: 260, damping: 24, mass: 0.4 } as Transition,
  /** Drag / swipe inertia. */
  drag:     { type: "spring", stiffness: 180, damping: 22, mass: 0.6 } as Transition,
  /** Tap press-down. */
  tap:      { type: "spring", stiffness: 400, damping: 30, mass: 0.3 } as Transition,
};


// ── Spring presets ──────────────────────────────────────────────
export const spring = {
  /** Default — responsive, no overshoot, Apple-like */
  default: { type: "spring", damping: 26, stiffness: 200 } as Transition,
  /** Snappy — quick taps, badges, micro-interactions */
  snappy: { type: "spring", damping: 20, stiffness: 300 } as Transition,
  /** Gentle — progress bars, slow reveals */
  gentle: { type: "spring", damping: 30, stiffness: 150 } as Transition,
  /** Bounce — notification badges, celebrations */
  bounce: { type: "spring", damping: 15, stiffness: 200 } as Transition,
  /** Premium — Framer site-grade reveal: heavy, settled, expensive */
  premium: { type: "spring", damping: 22, stiffness: 140, mass: 0.6 } as Transition,
  /** Overshoot — subtle Apple-style delight (icons, badges) */
  overshoot: { type: "spring", damping: 14, stiffness: 220, mass: 0.5 } as Transition,
};

// ── Stagger timing ─────────────────────────────────────────────
export const stagger = {
  /** 40ms — default list/grid stagger */
  default: 0.04,
  /** 60ms — slower, more deliberate stagger */
  slow: 0.06,
};

// ── Reusable animation variants ────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export const blurFadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

// ── Container variant with stagger ─────────────────────────────
export const staggerContainer = (staggerTime = stagger.default): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: staggerTime },
  },
});

// ── Hover / Tap presets ────────────────────────────────────────
export const hoverLift = {
  whileHover: { y: -4, transition: { type: "spring", damping: 20, stiffness: 300 } },
};

export const tapScale = {
  whileTap: { scale: 0.97 },
};

export const ctaHover = {
  whileHover: { scale: 1.02, transition: { type: "spring", damping: 20, stiffness: 300 } },
  whileTap: { scale: 0.97 },
};

export const hoverLiftSubtle = {
  whileHover: { y: -2, transition: { type: "spring", damping: 20, stiffness: 300 } },
};

// ── Parallax helper ────────────────────────────────────────────
/**
 * Subtle scroll-driven Y translation for background layers.
 * Returns a MotionValue<number> that animates from -range to +range
 * as the section scrolls through the viewport. Returns a constant 0
 * when the user prefers reduced motion.
 */
export function useParallaxY(
  targetRef: RefObject<HTMLElement>,
  range: number = 30
): MotionValue<number> {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });
  return useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-range, range]);
}
