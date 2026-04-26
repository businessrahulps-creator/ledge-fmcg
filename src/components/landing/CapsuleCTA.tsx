import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { spring } from "@/lib/motion";
import { useCursorVars } from "@/hooks/use-cursor-vars";
import { MagneticWrapper } from "./MagneticWrapper";

const MotionLink = motion.create(Link);
const MotionA = motion.a;

type Props = {
  to?: string;
  href?: string;
  children: ReactNode;
  variant?: "light" | "dark";
  className?: string;
  external?: boolean;
};

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/**
 * Premium capsule CTA — neumorphic pill with magnetic pointer pull,
 * cursor-following light bloom, and elegant click ripple. Apple/Framer-grade.
 */
export function CapsuleCTA({ to, href, children, variant = "light", className = "", external }: Props) {
  const innerRef = useRef<HTMLSpanElement>(null);
  useCursorVars(innerRef);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const cls = `lp-capsule-cta ${variant === "dark" ? "lp-capsule-cta--dark" : ""} ${className}`;

  const spawnRipple = (e: ReactPointerEvent<HTMLElement>) => {
    const target = innerRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((r) => r.filter((rp) => rp.id !== id));
    }, 620);
  };

  const content = (
    <>
      <span ref={innerRef} className="lp-capsule-cta__inner">
        <span className="lp-capsule-cta__label">{children}</span>
        {ripples.map((r) => (
          <span
            key={r.id}
            className="lp-capsule-cta__ripple"
            style={{ left: r.x, top: r.y }}
          />
        ))}
      </span>
      <span className="lp-capsule-cta__arrow" aria-hidden>
        <ArrowRight size={18} strokeWidth={2.2} />
      </span>
    </>
  );

  const motionProps = {
    whileTap: { scale: 0.985 },
    transition: spring.snappy,
    onPointerDown: spawnRipple,
  };

  let element;
  if (href) {
    element = (
      <MotionA
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cls}
        {...motionProps}
      >
        {content}
      </MotionA>
    );
  } else {
    element = (
      <MotionLink to={to ?? "/"} className={cls} {...motionProps}>
        {content}
      </MotionLink>
    );
  }

  return <MagneticWrapper className="inline-flex">{element}</MagneticWrapper>;
}
