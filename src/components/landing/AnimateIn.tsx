import { forwardRef, useState, useEffect, useRef, ReactNode } from "react";
import { motion, useInView, useReducedMotion, Variants } from "framer-motion";
import { fadeUp, scaleUp, blurFadeUp, fadeIn, staggerContainer, ease, duration, rank } from "@/lib/motion";

type AnimateVariant = "fadeUp" | "scaleUp" | "blurFadeUp" | "fadeIn";

const variantMap: Record<AnimateVariant, Variants> = {
  fadeUp,
  scaleUp,
  blurFadeUp,
  fadeIn,
};

/** Motion v2 rank mapping — every variant resolves to a ranked entrance. */
const variantRank: Record<AnimateVariant, keyof typeof rank> = {
  blurFadeUp: "lead",     // hero / section headings
  scaleUp:    "support",  // cards
  fadeUp:     "support",  // default body content
  fadeIn:     "ambient",  // pills, chips, decoration
};

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: AnimateVariant;
}

export const AnimateIn = forwardRef<HTMLDivElement, AnimateInProps>(
  function AnimateIn({ children, className, delay = 0, variant = "fadeUp" }, _ref) {
    const innerRef = useRef(null);
    const isInView = useInView(innerRef, { once: true, margin: "-80px" });
    const reduce = useReducedMotion();
    const variants = variantMap[variant];
    const r = rank[variantRank[variant]];

    // Reduced motion: collapse to a 200ms opacity-only fade.
    const transition = reduce
      ? { duration: 0.2, ease: ease.decelerate, delay }
      : { duration: r.duration, ease: r.ease, delay };

    return (
      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={reduce ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : variants}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);


// ── Stagger Container ──────────────────────────────────────────
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerTime?: number;
}

export function StaggerContainer({ children, className, staggerTime = 0.06 }: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer(staggerTime)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger Item (child of StaggerContainer) ───────────────────
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  variant?: AnimateVariant;
}

export function StaggerItem({ children, className, variant = "fadeUp" }: StaggerItemProps) {
  const variants = variantMap[variant];
  const r = rank[variantRank[variant]];

  return (
    <motion.div
      variants={variants}
      transition={{ duration: r.duration, ease: r.ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function useCountUp(end: number, isInView: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isInView || hasRun.current) return;
    hasRun.current = true;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return count;
}
