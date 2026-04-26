import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, LayoutDashboard, Layers, Route, IndianRupee } from "lucide-react";
import { spring } from "@/lib/motion";
import ledgeLogo from "@/assets/ledge-logo.png";
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

const desktopLinks = links.slice(1); // exclude Home from desktop nav

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
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
        scrolled
          ? "bg-white/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-[#E5E7EB]/60 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_4px_20px_-8px_rgba(15,23,42,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center" aria-label="Ledge home">
          <img src={ledgeLogo} alt="Ledge" className="h-7 w-auto" />
        </Link>

        {/* Center links - desktop */}
        <div className="hidden md:flex items-center gap-8">
          {desktopLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-body font-medium text-[15px] text-[#64748B] hover:text-[#0A0F1C] transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA - desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="font-body font-medium text-[15px] text-[#64748B] hover:text-[#0A0F1C] transition-colors duration-200">
            Sign in
          </Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring.snappy}>
            <Link
              to="/signup"
              className="lp-btn-primary-dark inline-flex items-center text-white px-6 py-2.5 rounded-full font-body font-semibold transition-colors duration-200 text-[13.5px]"
            >
              Start Free Trial
            </Link>
          </motion.div>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden text-[#1A1A1A] p-2 -mr-2" aria-label="Open menu">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-white border-[#E8E5E0] w-80 flex flex-col p-6 [&>button]:rounded-full [&>button]:border [&>button]:border-[#E8E5E0] [&>button]:w-8 [&>button]:h-8 [&>button]:flex [&>button]:items-center [&>button]:justify-center"
          >
            <SheetHeader>
              <SheetTitle className="text-[#1A1A1A] font-heading text-lg">Menu</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-1 mt-6 flex-1">
              {links.map((l) => {
                const Icon = l.icon;
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3.5 px-3 py-3 rounded-xl font-body font-medium text-[17px] text-[#52525B] hover:text-[#1A1A1A] hover:bg-[#F4F4F5] transition-all duration-150"
                  >
                    <Icon size={20} strokeWidth={1.5} />
                    {l.label}
                  </a>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 pb-2">
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center bg-[#27272A] text-white rounded-2xl py-3.5 font-body font-semibold text-base hover:bg-[#1A1A1A] transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center bg-[#F4F4F5] text-[#1A1A1A] rounded-2xl py-3.5 font-body font-semibold text-base hover:bg-[#E8E5E0] transition-colors"
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
