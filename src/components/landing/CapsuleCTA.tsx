import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";
import type { ReactNode } from "react";

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

/**
 * Neumorphic capsule CTA — pill-in-pill with trailing arrow chamber.
 * Reference: the soft "Get Started" capsule.
 */
export function CapsuleCTA({ to, href, children, variant = "light", className = "", external }: Props) {
  const cls = `lp-capsule-cta ${variant === "dark" ? "lp-capsule-cta--dark" : ""} ${className}`;
  const content = (
    <>
      <span className="lp-capsule-cta__inner">{children}</span>
      <span className="lp-capsule-cta__arrow" aria-hidden>
        <ArrowRight size={18} strokeWidth={2.2} />
      </span>
    </>
  );

  const motionProps = {
    whileTap: { scale: 0.985 },
    transition: spring.snappy,
  };

  if (href) {
    return (
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
  }
  return (
    <MotionLink to={to ?? "/"} className={cls} {...motionProps}>
      {content}
    </MotionLink>
  );
}
