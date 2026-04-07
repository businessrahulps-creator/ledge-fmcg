import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-fog"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center">
          <span className="font-heading font-extrabold text-xl tracking-[-0.04em] text-midnight">Ledge</span>
        </a>

        {/* Center links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-body font-medium text-[15px] text-graphite hover:text-midnight transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA — desktop */}
        <div className="hidden md:block">
          <Link
            to="/signup"
            className="inline-flex items-center bg-indigo-600 text-white px-6 py-2.5 rounded-full font-body font-semibold text-sm hover:bg-indigo-700 transition-colors duration-200"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden text-midnight p-2 -mr-2" aria-label="Open menu">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-white border-fog w-72 flex flex-col">
            <SheetHeader>
              <SheetTitle className="text-midnight font-heading">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 mt-8 flex-1">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-body font-medium text-lg text-graphite hover:text-midnight transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center bg-ink text-white px-6 py-3 rounded-full font-body font-semibold text-base hover:bg-ink-light transition-colors mb-4"
            >
              Start Free Trial
            </Link>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
