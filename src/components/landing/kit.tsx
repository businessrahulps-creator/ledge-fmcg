import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { InViewTitle } from "@/components/arc/in-view-title/in-view-title";

/**
 * Landing kit (monochrome v5). Every section is built from these pieces so
 * the page reads as one system: same width, same header, same card, same motion.
 */

export type Ground = "light" | "grey" | "dark";

interface SectionProps {
  id?: string;
  ground: Ground;
  children: ReactNode;
  tight?: boolean;
  ruled?: boolean;
  className?: string;
  labelledBy?: string;
}

export function Section({ id, ground, children, tight, ruled, className = "", labelledBy }: SectionProps) {
  const cls = [
    "lpx-section",
    tight ? "lpx-section--tight" : "",
    `lpx-${ground}`,
    ground === "dark" ? "arc-dark" : "",
    ruled ? "lpx-ruled" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <section id={id} className={cls} aria-labelledby={labelledBy}>
      <div className="lpx-container">{children}</div>
    </section>
  );
}

interface HeadProps {
  num?: string;
  eyebrow: string;
  title: string;
  lines?: string[];
  lede?: ReactNode;
  align?: "center" | "left";
  id?: string;
}

/** The one section header: numbered eyebrow, serif headline that blurs in, one line of text. */
export function SectionHead({ num, eyebrow, title, lines, lede, align = "center", id }: HeadProps) {
  return (
    <div className={`lpx-head ${align === "left" ? "lpx-head--left" : ""}`}>
      <span className="lpx-eyebrow">
        {num && <span className="lpx-eyebrow__num">{num}</span>}
        {num && <span aria-hidden>/</span>}
        {eyebrow}
      </span>
      <InViewTitle as="h2" id={id} text={title} lines={lines} variant="blur" className="lpx-title" />
      {lede && (
        <Reveal delay={0.1}>
          <p className="lpx-lede">{lede}</p>
        </Reveal>
      )}
    </div>
  );
}

/** The one entrance: a short rise and fade. Turns off for reduced motion. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

interface BtnProps {
  to: string;
  children: ReactNode;
  ghost?: boolean;
  block?: boolean;
  external?: boolean;
  ariaLabel?: string;
}

export function Btn({ to, children, ghost, block, external, ariaLabel }: BtnProps) {
  const cls = ["lpx-btn", ghost ? "lpx-btn--ghost" : "", block ? "lpx-btn--block" : ""].filter(Boolean).join(" ");
  if (external || to.startsWith("#") || to.startsWith("http")) {
    return (
      <a href={to} className={cls} aria-label={ariaLabel} {...(to.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return <Link to={to} className={cls} aria-label={ariaLabel}>{children}</Link>;
}
