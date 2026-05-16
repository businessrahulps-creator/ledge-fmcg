import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { spring } from "@/lib/motion";
import ledgeLogo from "@/assets/ledge-logo.webp";
import { MorphHamburger } from "@/components/landing/MorphHamburger";
import { MobileMenuOverlay } from "@/components/landing/MobileMenuOverlay";
import { NavCommandPalette } from "@/components/landing/NavCommandPalette";
import { Search } from "lucide-react";

const desktopLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
        className="fixed top-0 left-0 right-0 z-50 pt-3 md:pt-4 pointer-events-none"
        aria-label="Primary"
      >
        {/* ===== Desktop: split → merged capsules ===== */}
        <motion.div
          className="hidden md:flex items-center justify-center mx-auto px-4 pointer-events-none"
          animate={{ maxWidth: scrolled ? 920 : 1280 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
        >
          <motion.div
            className="flex items-center w-full pointer-events-auto"
            animate={{ gap: scrolled ? 0 : 12 }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
          >
            {/* Left capsule */}
            <motion.div
              className="lp-nav-capsule px-3"
              animate={{
                borderTopRightRadius: scrolled ? 0 : 9999,
                borderBottomRightRadius: scrolled ? 0 : 9999,
                paddingRight: scrolled ? 8 : 12,
              }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            >
              <Link to="/" className="flex items-center gap-2 pr-2" aria-label="Ledge home">
                <img
                  src={ledgeLogo}
                  alt="Ledge"
                  width={28}
                  height={28}
                  decoding="async"
                  // @ts-expect-error fetchpriority is valid HTML but not yet in React types
                  fetchpriority="high"
                  className="h-7 w-auto"
                />
              </Link>
              <span className="lp-nav-divider" aria-hidden />
              <span className="lp-nav-status" role="status" aria-live="polite">
                <span className="lp-nav-status-dot" aria-hidden />
                <span className="hidden lg:inline">All systems operational</span>
                <span className="inline lg:hidden">Live</span>
              </span>
            </motion.div>

            {/* Spacer — collapses to 0 on scroll, merging capsules into one pill */}
            <motion.div
              className="flex-1"
              animate={{ flexGrow: scrolled ? 0 : 1, width: scrolled ? 0 : "auto" }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            />

            {/* Right capsule */}
            <motion.div
              className="lp-nav-capsule px-2"
              animate={{
                borderTopLeftRadius: scrolled ? 0 : 9999,
                borderBottomLeftRadius: scrolled ? 0 : 9999,
                paddingLeft: scrolled ? 8 : 8,
                marginLeft: scrolled ? -1 : 0,
              }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            >
              <div className="flex items-center gap-1">
                {desktopLinks.map((l) => (
                  <a key={l.href} href={l.href} className="lp-nav-link">
                    {l.label}
                  </a>
                ))}
              </div>
              <span className="lp-nav-divider" aria-hidden />
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="lp-nav-kbd mr-1"
                aria-label="Open command palette"
              >
                <Search size={12} strokeWidth={2.2} />
                <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
                <kbd>K</kbd>
              </button>
              <Link to="/login" className="lp-nav-link">
                Sign in
              </Link>
              <motion.div whileTap={{ scale: 0.97 }} transition={spring.snappy} className="ml-1">
                <Link to="/signup" className="lp-nav-cta">
                  Start Free Trial
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ===== Mobile: single floating pill ===== */}
        <div className="md:hidden px-4 pointer-events-none">
          <div
            className={`lp-nav-capsule flex items-center justify-between w-full px-3 pointer-events-auto transition-opacity duration-200 ${
              open ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <Link to="/" className="flex items-center" aria-label="Ledge home">
              <img
                src={ledgeLogo}
                alt="Ledge"
                width={28}
                height={28}
                decoding="async"
                // @ts-expect-error fetchpriority is valid HTML but not yet in React types
                fetchpriority="high"
                className="h-7 w-auto"
              />
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label="Open command palette"
              >
                <Search size={16} strokeWidth={2.2} />
              </button>
              <MorphHamburger open={false} onClick={() => setOpen(true)} />
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && <MobileMenuOverlay onClose={() => setOpen(false)} />}
      </AnimatePresence>

      <NavCommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
