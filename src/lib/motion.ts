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
  hidden: { opacity: 0, y: 8 },
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

// ── Container variant with stagger ─────────────────────────────
export const staggerContainer = (staggerTime = stagger.default): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: staggerTime },
  },
});
