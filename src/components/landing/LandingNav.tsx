import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? "bg-[#08080D]/95 backdrop-blur-md border-b border-[#1E1E2C]" : "bg-transparent"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
          <a href="#" className="flex items-center">
            <span className="font-heading font-extrabold text-xl tracking-[-0.04em] text-[#F2F2F5]">Ledge</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-[#8888A0] hover:text-[#F2F2F5] transition-colors duration-150"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm text-[#8888A0] hover:text-[#F2F2F5] transition-colors">
              Log in
            </Link>
            <Link
              to="/signup"
              className="h-10 px-5 rounded-xl bg-[#3D6FFF] text-white text-sm font-medium flex items-center hover:bg-[#5585FF] hover:scale-[1.02] transition-all duration-150"
            >
              Start free trial
            </Link>
          </div>

          <button
            className="md:hidden text-[#F2F2F5] p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#08080D] flex flex-col items-center justify-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="text-2xl text-[#F2F2F5] font-medium"
            >
              {l.label}
            </a>
          ))}
          <Link to="/login" className="text-lg text-[#8888A0]" onClick={() => setMobileOpen(false)}>
            Log in
          </Link>
          <Link
            to="/signup"
            className="h-12 px-8 rounded-xl bg-[#3D6FFF] text-white font-medium flex items-center"
            onClick={() => setMobileOpen(false)}
          >
            Start free trial
          </Link>
        </div>
      )}
    </>
  );
}
