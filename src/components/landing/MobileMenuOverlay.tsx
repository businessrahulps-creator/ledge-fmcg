import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { MorphHamburger } from "./MorphHamburger";
import ledgeLogo from "@/assets/ledge-logo.png";

interface MobileMenuOverlayProps {
  onClose: () => void;
}

const navLinks = [
  { eyebrow: "Discover", label: "Home", href: "/#" },
  { eyebrow: "Explore", label: "Features", href: "/#features" },
  { eyebrow: "Learn", label: "How It Works", href: "/#how-it-works" },
  { eyebrow: "Plans", label: "Pricing", href: "/#pricing" },
];

/**
 * Stable mobile menu overlay.
 * Intentionally minimal lifecycle: NO history mutation, NO body scroll-lock
 * mutation. Only Esc-to-close + a pointer-events guard during exit so the
 * fading overlay can never block the page.
 */
export function MobileMenuOverlay({ onClose }: MobileMenuOverlayProps) {
  const reduce = useReducedMotion();
  const firstFocusRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => firstFocusRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [onClose]);

  const easeOut = [0.16, 1, 0.3, 1] as const;
  const easeIn = [0.7, 0, 0.84, 0] as const;

  const childVariants = {
    hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -16, filter: "blur(6px)" },
  };

  const childEnter = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 200, damping: 24, mass: 0.7 };

  const childExit = reduce ? { duration: 0 } : { duration: 0.28, ease: easeIn };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Main navigation"
      className="md:hidden fixed inset-0 z-[60] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: reduce ? 0 : 0.32, ease: easeOut }}
    >
      <motion.div
        className="absolute inset-0 lp-mobile-menu-bg"
        initial={{ scale: 1.02, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.015, opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.32, ease: reduce ? easeOut : easeIn }}
      />
      <div className="lp-noise absolute inset-0 pointer-events-none opacity-[0.35]" aria-hidden />

      <motion.div
        className="relative h-full w-full flex flex-col px-7 pt-3 pb-7"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={{
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
          exit: { transition: { staggerChildren: 0.035, staggerDirection: -1 } },
        }}
      >
        <motion.div
          className="h-[60px] flex items-center justify-between"
          variants={childVariants}
          transition={childEnter}
          exit={{ opacity: 0, y: -16, filter: "blur(6px)", transition: childExit }}
        >
          <Link to="/" onClick={onClose} aria-label="Ledge home">
            <img src={ledgeLogo} alt="Ledge" width={96} height={28} className="h-7 w-auto" />
          </Link>
          <MorphHamburger open={true} onClick={onClose} />
        </motion.div>

        <nav className="flex-1 flex flex-col justify-center gap-7 -mt-4">
          {navLinks.map((l, i) => (
            <motion.a
              key={l.href}
              ref={i === 0 ? firstFocusRef : undefined}
              href={l.href}
              onClick={onClose}
              variants={childVariants}
              transition={childEnter}
              exit={{ opacity: 0, y: -16, filter: "blur(6px)", transition: childExit }}
              className="lp-menu-link group block py-2 -my-2 active:scale-[0.98] transition-transform"
            >
              <span className="lp-menu-link-eyebrow block mb-1.5">{l.eyebrow}</span>
              <span className="font-heading font-semibold text-[40px] leading-[1.05] tracking-[-0.02em] text-foreground">
                {l.label}
              </span>
              <span className="lp-menu-link-underline" />
            </motion.a>
          ))}
        </nav>

        <motion.div
          className="flex justify-center mb-5"
          variants={childVariants}
          transition={childEnter}
          exit={{ opacity: 0, y: -16, filter: "blur(6px)", transition: childExit }}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted border border-border text-[12px] text-muted-foreground font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] shadow-[0_0_0_3px_hsl(var(--success)/0.18)]" />
            30-day free trial · No card · Cancel anytime
          </span>
        </motion.div>

        <motion.div
          className="flex flex-col gap-3"
          variants={childVariants}
          transition={childEnter}
          exit={{ opacity: 0, y: -16, filter: "blur(6px)", transition: childExit }}
        >
          <Link
            to="/signup"
            onClick={onClose}
            className="lp-btn-primary-dark lp-shimmer flex items-center justify-center rounded-md py-4 font-body font-semibold text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Start Free Trial
          </Link>
          <Link
            to="/login"
            onClick={onClose}
            className="flex items-center justify-center bg-muted hover:bg-muted/70 text-foreground border border-border rounded-md py-4 font-body font-semibold text-[15px] transition-colors"
          >
            Sign in
          </Link>
        </motion.div>

        <motion.div
          className="pt-5 flex items-center justify-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground)/0.7)]"
          variants={childVariants}
          transition={childEnter}
          exit={{ opacity: 0, y: -16, filter: "blur(6px)", transition: childExit }}
        >
          <span aria-hidden>🪔</span>
          <span>Built in God's Own Country · Kerala</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
