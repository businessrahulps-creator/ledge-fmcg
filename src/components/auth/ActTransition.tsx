import { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface Props {
  actKey: string;
  children: ReactNode;
  className?: string;
}

/**
 * Cross-fade + 24px slide between acts. Falls back to opacity-only when
 * prefers-reduced-motion is set. One panel, one beat — no flash, no jank.
 */
export function ActTransition({ actKey, children, className }: Props) {
  const reduce = useReducedMotion();
  const motionProps = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18 },
      }
    : {
        initial: { opacity: 0, y: 24, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -16, filter: "blur(4px)" },
        transition: { duration: 0.42, ease: [0.1, 0.9, 0.2, 1] }, // fluent-decel
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={actKey} className={className} {...motionProps}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
