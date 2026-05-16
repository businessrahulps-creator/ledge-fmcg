import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { WA_GREEN } from "./constants";

/**
 * Mobile-only floating WhatsApp button.
 * Appears after the user scrolls past the hero (~600px).
 * The single highest-leverage element for WhatsApp lead capture.
 */
export function MobileWhatsAppFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="https://wa.me/918138084689?text=Hi%20Ledge%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20platform"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Ledge sales on WhatsApp"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="md:hidden fixed bottom-5 right-5 z-40 flex items-center justify-center w-[52px] h-[52px] rounded-full text-white active:scale-95 transition-transform"
          style={{ backgroundColor: WA_GREEN, boxShadow: "0 8px 28px -6px rgba(37,211,102,0.55), 0 2px 6px rgba(0,0,0,0.12)" }}
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full opacity-50 animate-ping"
            style={{ backgroundColor: WA_GREEN, animationDuration: "2.4s" }}
          />
          <WhatsAppIcon className="relative w-6 h-6" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
