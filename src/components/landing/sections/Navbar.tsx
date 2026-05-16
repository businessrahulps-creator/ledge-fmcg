import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { spring } from "@/lib/motion";
import ledgeLogo from "@/assets/ledge-logo.png";
import { MorphHamburger } from "@/components/landing/MorphHamburger";
import { MobileMenuOverlay } from "@/components/landing/MobileMenuOverlay";

const desktopLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
        className={`fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center transition-all duration-300 ${
          scrolled
            ? "bg-background/75 backdrop-blur-xl backdrop-saturate-[1.8] border-b border-border shadow-depth-2"
            : "bg-transparent"
        }`}
      >
        {scrolled && (
          <div className="lp-noise absolute inset-0 pointer-events-none opacity-30" aria-hidden />
        )}
        <div className="relative max-w-7xl mx-auto w-full px-6 md:px-8 lg:px-10 flex items-center justify-between">
          {/* Logo — fades when overlay open so it doesn't double-stack */}
          <Link
            to="/"
            className={`flex items-center transition-opacity duration-200 ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            aria-label="Ledge home"
          >
            <img
              src={ledgeLogo}
              alt="Ledge"
              width={96}
              height={28}
              decoding="async"
              // @ts-expect-error fetchpriority is valid HTML but not yet in React types
              fetchpriority="high"
              className="h-7 w-auto"
            />
          </Link>

          {/* Center links - desktop */}
          <div className="hidden md:flex items-center gap-7">
            {desktopLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-body font-medium text-[14px] tracking-[-0.005em] text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA - desktop */}
          <div className="hidden md:flex items-center gap-5">
            <Link to="/login" className="font-body font-medium text-[14px] tracking-[-0.005em] text-muted-foreground hover:text-foreground transition-colors duration-200">
              Sign in
            </Link>
            <motion.div whileTap={{ scale: 0.97 }} transition={spring.snappy}>
              <Link
                to="/signup"
                className="lp-btn-primary-dark inline-flex items-center px-5 py-2 rounded-full font-body font-semibold text-[13.5px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Start Free Trial
              </Link>
            </motion.div>
          </div>

          {/* Mobile hamburger — hidden while overlay is open (overlay renders its own close button) */}
          <div className={`md:hidden transition-opacity duration-150 ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <MorphHamburger open={false} onClick={() => setOpen(true)} />
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && <MobileMenuOverlay onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
