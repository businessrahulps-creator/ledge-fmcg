import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { MorphHamburger } from "./MorphHamburger";
import { Nilavilakku } from "./Nilavilakku";
import ledgeLogo from "@/assets/ledge-logo.webp";

interface MobileMenuOverlayProps {
  onClose: () => void;
}

const navLinks = [
  { eyebrow: "Discover", label: "Home", href: "/#" },
  { eyebrow: "Explore", label: "Features", href: "/#features" },
  { eyebrow: "Learn", label: "How It Works", href: "/#how-it-works" },
  { eyebrow: "Plans", label: "Pricing", href: "/#pricing" },
];

export function MobileMenuOverlay({ onClose }: MobileMenuOverlayProps) {
  const reduce = useReducedMotion();
  const firstFocusRef = useRef<HTMLAnchorElement>(null);

  // Body scroll lock + Esc + back button
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // Push a history state so back button closes the menu
    window.history.pushState({ mobileMenu: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);

    // Initial focus
    const t = window.setTimeout(() => firstFocusRef.current?.focus(), 60);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      window.clearTimeout(t);
      // Pop our pushed state if still present
      if (window.history.state?.mobileMenu) {
        window.history.back();
      }
    };
  }, [onClose]);

  const easing = [0.16, 1, 0.3, 1] as const;

  const childVariants = {
    hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  };

  const childTransition = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 200, damping: 24, mass: 0.7 };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Main navigation"
      className="md:hidden fixed inset-0 z-[60] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.22, ease: easing }}
    >
      {/* Background layers */}
      <motion.div
        className="absolute inset-0 lp-mobile-menu-bg"
        initial={{ scale: 1.02, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.28, ease: easing }}
      />
      <div className="lp-noise absolute inset-0 pointer-events-none opacity-[0.35]" aria-hidden />

      {/* Content stack */}
      <motion.div
        className="relative h-full w-full flex flex-col px-7 pt-3 pb-7"
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, transition: { duration: 0.16 } }}
        variants={{
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
        }}
      >
        {/* Top bar — mirrors navbar height */}
        <motion.div
          className="h-[54px] flex items-center justify-between"
          variants={childVariants}
          transition={childTransition}
        >
          <Link to="/" onClick={onClose} aria-label="Ledge home">
            <img src={ledgeLogo} alt="Ledge" width={96} height={28} className="h-7 w-auto" />
          </Link>
          <MorphHamburger open={true} onClick={onClose} />
        </motion.div>

        {/* Link list */}
        <nav className="flex-1 flex flex-col justify-center gap-7 -mt-4">
          {navLinks.map((l, i) => (
            <motion.a
              key={l.href}
              ref={i === 0 ? firstFocusRef : undefined}
              href={l.href}
              onClick={onClose}
              variants={childVariants}
              transition={childTransition}
              className="lp-menu-link group block active:scale-[0.98] transition-transform"
            >
              <span className="lp-menu-link-eyebrow block mb-1.5">{l.eyebrow}</span>
              <span className="font-heading font-semibold text-[40px] leading-[1.05] tracking-[-0.02em] text-[#0A0F1C]">
                {l.label}
              </span>
              <span className="lp-menu-link-underline" />
            </motion.a>
          ))}
        </nav>

        {/* Trust chip */}
        <motion.div
          className="flex justify-center mb-5"
          variants={childVariants}
          transition={childTransition}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A0F1C]/[0.04] border border-[#0A0F1C]/[0.06] text-[12px] text-[#52525B] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shadow-[0_0_0_3px_rgba(22,163,74,0.18)]" />
            30-day free trial · No card · Cancel anytime
          </span>
        </motion.div>

        {/* CTAs */}
        <motion.div className="flex flex-col gap-3" variants={childVariants} transition={childTransition}>
          <Link
            to="/signup"
            onClick={onClose}
            className="lp-btn-primary-dark lp-shimmer flex items-center justify-center text-white rounded-2xl py-4 font-body font-semibold text-[15px]"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            onClick={onClose}
            className="flex items-center justify-center bg-[#0A0F1C]/[0.04] hover:bg-[#0A0F1C]/[0.07] text-[#0A0F1C] border border-[#0A0F1C]/[0.06] rounded-2xl py-4 font-body font-semibold text-[15px] transition-colors"
          >
            Sign in
          </Link>
        </motion.div>

        {/* Kerala signature */}
        <motion.div
          className="pt-5 flex items-center justify-center gap-2 text-[11px] text-[#94A3B8]"
          variants={childVariants}
          transition={childTransition}
        >
          <Nilavilakku />
          <span>Built in God's Own Country · Kerala</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
