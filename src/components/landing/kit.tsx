import { LandingBot } from "./LandingBot";
import type { LandingBotKey } from "./bots";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

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
  bot?: LandingBotKey;
}

/** The one section header: numbered eyebrow, serif headline that blurs in, one line of text. */
export function SectionHead({ num, eyebrow, title, lines, lede, align = "center", id, bot }: HeadProps) {
  return (
    <div className={`lpx-head ${align === "left" ? "lpx-head--left" : ""}`}>
      {bot && <Reveal><LandingBot id={bot} /></Reveal>}
      <span className="lpx-eyebrow">
        {num && <span className="lpx-eyebrow__num">{num}</span>}
        {num && <span aria-hidden>/</span>}
        {eyebrow}
      </span>
      <Reveal><Title as="h2" id={id} text={title} lines={lines} /></Reveal>
      {lede && (
        <Reveal delay={0.1}>
          <p className="lpx-lede">{lede}</p>
        </Reveal>
      )}
    </div>
  );
}

/** One calm motion vocabulary for the whole page (Apple-style: strong ease-out, no bounce, plays once). */
export const EASE = [0.23, 1, 0.32, 1] as const;
export const REVEAL_S = 0.6;
export const STAGGER_S = 0.07;

/** Headline text. Static: titles never animate word by word. */
export function Title({ as: Tag = "h2", id, text, lines, hero }: { as?: "h1" | "h2"; id?: string; text: string; lines?: string[]; hero?: boolean }) {
  return (
    <Tag id={id} className={`lpx-title ${hero ? "lpx-title--hero" : ""}`} aria-label={lines ? text : undefined}>
      {lines ? lines.map((l, i) => <span key={i} className="block" aria-hidden>{l}</span>) : text}
    </Tag>
  );
}

/** The one entrance: a gentle 16px rise and fade, once. Off for reduced motion. */
export function Reveal({ children, delay = 0, index = 0, className }: { children: ReactNode; delay?: number; index?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: REVEAL_S, ease: EASE, delay: delay + Math.min(index, 5) * STAGGER_S }}
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
