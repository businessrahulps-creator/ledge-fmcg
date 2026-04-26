import { useRef, ReactNode, Children } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface Props {
  children: ReactNode;
  className?: string;
  /** Per-word delay in seconds */
  stagger?: number;
  /** Initial delay in seconds */
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

/**
 * Splits text content into words and reveals them with a Framer-style
 * blur + y + opacity spring sweep on scroll-into-view. Renders <br /> children
 * untouched. Single-pass — never loops.
 */
export function TextReveal({
  children,
  className,
  stagger = 0.04,
  delay = 0,
  as: Tag = "h2",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  // Flatten children into an ordered array of word-tokens and <br /> elements.
  const tokens: Array<{ type: "word"; text: string } | { type: "br" }> = [];
  Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      String(child)
        .split(/(\s+)/)
        .forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) tokens.push({ type: "word", text: " " });
          else tokens.push({ type: "word", text: part });
        });
    } else {
      // Treat any element child as a line break for our headline use-case.
      tokens.push({ type: "br" });
    }
  });

  if (reduce) {
    return <Tag ref={ref as never} className={className}>{children}</Tag>;
  }

  let wordIdx = 0;
  return (
    <Tag ref={ref as never} className={className} aria-label={typeof children === "string" ? children : undefined}>
      {tokens.map((t, i) => {
        if (t.type === "br") return <br key={`br-${i}`} />;
        if (t.text === " ") return <span key={`sp-${i}`}> </span>;
        const idx = wordIdx++;
        return (
          <motion.span
            key={`w-${i}`}
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 14, filter: "blur(8px)" }}
            transition={{
              type: "spring",
              stiffness: 140,
              damping: 22,
              mass: 0.6,
              delay: delay + idx * stagger,
            }}
            style={{ display: "inline-block", willChange: "transform, opacity, filter" }}
          >
            {t.text}
          </motion.span>
        );
      })}
    </Tag>
  );
}
