import type { Transition, Variants } from "framer-motion";

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
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
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
