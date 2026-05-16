import { motion, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";

interface MorphHamburgerProps {
  open: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Premium animated hamburger that morphs into an X with spring physics.
 * Two horizontal lines rotate ±45° and meet at center on open.
 */
export const MorphHamburger = forwardRef<HTMLButtonElement, MorphHamburgerProps>(
  ({ open, onClick, className = "" }, ref) => {
    const reduce = useReducedMotion();
    const transition = reduce
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.5 };

    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={onClick}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className={`md:hidden relative rounded-full bg-white/70 backdrop-blur-md border border-border w-9 h-9 flex items-center justify-center text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_2px_8px_-4px_rgba(15,23,42,0.12)] ${className}`}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <motion.line
            x1="3.5"
            x2="18.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            initial={false}
            animate={open ? { y1: 11, y2: 11, rotate: 45 } : { y1: 8, y2: 8, rotate: 0 }}
            transition={transition}
            style={{ originX: "11px", originY: "11px" }}
          />
          <motion.line
            x1="3.5"
            x2="18.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            initial={false}
            animate={open ? { y1: 11, y2: 11, rotate: -45 } : { y1: 14, y2: 14, rotate: 0 }}
            transition={transition}
            style={{ originX: "11px", originY: "11px" }}
          />
        </svg>
      </motion.button>
    );
  }
);
MorphHamburger.displayName = "MorphHamburger";
