import { forwardRef, type ReactNode, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { hoverIntent } from "@/lib/motion";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Disable hover/tap (e.g. for tinted dark cards that already have their own behavior). */
  inert?: boolean;
}

/**
 * Motion v3 — the only hover/tap pattern for cards across the landing page.
 * 120ms standard-ease 1px lift + 1% scale + 1.5% press. Cubic-bezier (not spring) so
 * a grid of cards lands in unison instead of each bouncing on its own timeline.
 *
 * Removes the need for per-card `whileHover` / `whileTap` props scattered across sections.
 */
export const PressableCard = forwardRef<HTMLDivElement, Props>(
  function PressableCard({ children, className, style, inert = false }, ref) {
    const reduce = useReducedMotion();
    const motionProps = inert || reduce ? {} : hoverIntent;
    return (
      <motion.div
        ref={ref}
        className={className}
        style={style}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
