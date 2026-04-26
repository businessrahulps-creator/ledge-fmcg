import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Mobile-only sticky bottom CTA bar.
 * Shows after the hero scrolls off and hides near the footer so it never
 * collides with the footer CTAs. Pure presentation, no business logic.
 */
export function MobileStickyCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const nearBottom = max - y < 600;
      setVisible(y > 800 && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 26 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-3 pt-2 pointer-events-none"
        >
          <div
            className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#0A0F1C]/[0.08] px-2 py-2 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_12px_28px_-12px_rgba(15,23,42,0.20)]"
          >
            <Link
              to="/signup"
              className="flex-1 lp-btn-primary-dark text-white rounded-xl py-3 text-center font-body font-semibold text-[14px]"
            >
              Start free
            </Link>
            <a
              href="https://wa.me/918138084689?text=Hi%20Ledge%2C%20I%27d%20like%20to%20learn%20more"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl py-3 text-center font-body font-semibold text-[14px] bg-[#25D366]/10 border border-[#25D366]/30 text-[#0F5132]"
              aria-label="WhatsApp Sales"
            >
              WhatsApp
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
