import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, LayoutDashboard, Layers, Route, IndianRupee } from "lucide-react";
import { spring } from "@/lib/motion";
import ledgeLogo from "@/assets/ledge-logo.webp";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Home", href: "/#", icon: LayoutDashboard },
  { label: "Features", href: "/#features", icon: Layers },
  { label: "How It Works", href: "/#how-it-works", icon: Route },
  { label: "Pricing", href: "/#pricing", icon: IndianRupee },
];

const desktopLinks = links.slice(1);

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
      className={`fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center transition-all duration-300 ${
        scrolled
          ? "bg-white/65 backdrop-blur-xl backdrop-saturate-[1.8] border-b border-[#0A0F1C]/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_24px_-16px_rgba(15,23,42,0.10)]"
          : "bg-transparent"
      }`}
    >
      {scrolled && (
        <div className="lp-noise absolute inset-0 pointer-events-none opacity-30" aria-hidden />
      )}
      <div className="relative max-w-7xl mx-auto w-full px-6 md:px-8 lg:px-10 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center" aria-label="Ledge home">
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
              className="font-body font-medium text-[14px] tracking-[-0.005em] text-[#64748B] hover:text-[#0A0F1C] transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA - desktop */}
        <div className="hidden md:flex items-center gap-5">
          <Link to="/login" className="font-body font-medium text-[14px] tracking-[-0.005em] text-[#64748B] hover:text-[#0A0F1C] transition-colors duration-200">
            Sign in
          </Link>
          <motion.div whileTap={{ scale: 0.97 }} transition={spring.snappy}>
            <Link
              to="/signup"
              className="lp-btn-primary-dark lp-shimmer inline-flex items-center text-white px-5 py-2 rounded-full font-body font-semibold text-[13.5px] transition-colors duration-200"
            >
              Start Free Trial
            </Link>
          </motion.div>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="md:hidden rounded-full bg-white/70 backdrop-blur-md border border-[#0A0F1C]/[0.06] w-9 h-9 flex items-center justify-center text-[#0A0F1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0F1C]/20 focus-visible:ring-offset-2"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-white/95 backdrop-blur-xl border-r border-[#0A0F1C]/[0.06] w-[88vw] sm:w-80 flex flex-col p-7 [&>button]:rounded-full [&>button]:border [&>button]:border-[#0A0F1C]/[0.08] [&>button]:w-8 [&>button]:h-8 [&>button]:flex [&>button]:items-center [&>button]:justify-center"
          >
            <div className="lp-noise absolute inset-0 pointer-events-none opacity-30" aria-hidden />
            <SheetHeader className="relative">
              <SheetTitle className="text-[#1A1A1A] font-heading text-lg">Menu</SheetTitle>
            </SheetHeader>

            <div className="relative flex flex-col gap-1 mt-6 flex-1">
              {links.map((l) => {
                const Icon = l.icon;
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-body font-medium text-[16px] text-[#52525B] hover:text-[#0A0F1C] hover:bg-[#0A0F1C]/[0.04] transition-all duration-150"
                  >
                    <Icon size={20} strokeWidth={1.75} />
                    {l.label}
                  </a>
                );
              })}
            </div>

            <div className="relative flex flex-col gap-3 pb-2">
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="lp-btn-primary-dark lp-shimmer flex items-center justify-center text-white rounded-2xl py-3.5 font-body font-semibold text-[15px] transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center bg-[#0A0F1C]/[0.04] hover:bg-[#0A0F1C]/[0.07] text-[#0A0F1C] border border-[#0A0F1C]/[0.06] rounded-2xl py-3.5 font-body font-semibold text-[15px] transition-colors"
              >
                Sign in
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.nav>
  );
}
