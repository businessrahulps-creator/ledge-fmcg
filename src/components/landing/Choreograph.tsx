import { forwardRef, useRef, type ReactNode, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { rank, type Rank, duration as dur, ease } from "@/lib/motion";

interface ChoreographProps {
  children: ReactNode;
  /** Motion rank — controls distance, blur, duration, easing, stagger. */
  rank?: Rank;
  className?: string;
  delay?: number;
  /** Use as a parent that staggers ranked children. */
  staggerChildren?: boolean;
  as?: "div" | "section" | "article" | "ul";
  style?: CSSProperties;
}

/**
 * Choreograph — the only entrance primitive on the landing page.
 * Reads rank tokens; never accepts inline transform/spring overrides.
 * `prefers-reduced-motion` collapses to a 200ms opacity-only fade.
 *
 * Usage:
 *   <Choreograph rank="lead"><h1>...</h1></Choreograph>
 *   <Choreograph rank="support" staggerChildren>
 *     <Choreograph rank="support">card 1</Choreograph>
 *     <Choreograph rank="support">card 2</Choreograph>
 *   </Choreograph>
 */
export const Choreograph = forwardRef<HTMLDivElement, ChoreographProps>(
  function Choreograph(
    { children, rank: r = "support", className, delay = 0, staggerChildren = false, as = "div", style },
    _ref
  ) {
    const innerRef = useRef<HTMLDivElement>(null);
    const inView = useInView(innerRef, { once: true, margin: "-80px" });
    const reduce = useReducedMotion();

    const token = rank[r];

    const variants: Variants = reduce
      ? {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              duration: 0.12,
              ease: ease.standard,
              ...(staggerChildren ? { staggerChildren: 0.01 } : {}),
            },
          },
        }
      : {
          hidden: {
            opacity: 0,
            y: token.y,
            filter: `blur(${token.blur}px)`,
            scale: token.scale,
          },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scale: 1,
            transition: {
              duration: token.duration,
              ease: token.ease,
              delay,
              ...(staggerChildren ? { staggerChildren: token.stagger, delayChildren: delay } : {}),
            },
          },
        };

    const MotionTag = (motion as any)[as];

    return (
      <MotionTag
        ref={innerRef}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={variants}
        className={className}
        style={{ ...style, willChange: reduce ? undefined : "transform, opacity, filter" }}
      >
        {children}
      </MotionTag>
    );
  }
);
