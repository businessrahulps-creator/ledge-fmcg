import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, LayoutDashboard, Layers, Route, IndianRupee } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Home", href: "/#", icon: Home },
  { label: "Features", href: "/#features", icon: Sparkles },
  { label: "How It Works", href: "/#how-it-works", icon: RefreshCw },
  { label: "Pricing", href: "/#pricing", icon: CreditCard },
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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
        scrolled
          ? "bg-[#F8F7F5]/95 backdrop-blur-md border-b border-[#E8E5E0]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="font-heading font-extrabold text-xl tracking-[-0.04em] text-[#1A1A1A]">Ledge</span>
        </Link>

        {/* Center links  -  desktop */}
        <div className="hidden md:flex items-center gap-8">
          {desktopLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-body font-medium text-[15px] text-[#71717A] hover:text-[#1A1A1A] transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA  -  desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="font-body font-medium text-[15px] text-[#52525B] hover:text-[#1A1A1A] transition-colors duration-200">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center bg-[#27272A] text-white px-8 py-3 rounded-2xl font-body font-semibold hover:bg-[#1A1A1A] hover:scale-[1.01] transition-all duration-200 text-xs"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
          >
            Get Started Free
          </Link>
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
                    <Icon size={20} strokeWidth={1.8} />
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
    </nav>
  );
}