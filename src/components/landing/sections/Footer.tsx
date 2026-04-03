import { Linkedin, Twitter, Youtube } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Changelog", "Roadmap"],
  },
  {
    title: "Company",
    links: ["About Us", "Blog", "Careers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Help Center", "WhatsApp Support", "Setup Guide", "API Docs (Soon)"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Refund Policy"],
  },
];

const socials = [
  { icon: Linkedin, href: "#" },
  { icon: Twitter, href: "#" },
  { icon: Youtube, href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-charcoal py-16 border-t border-slate-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-body font-semibold text-[14px] text-white uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-body text-[14px] text-silver hover:text-white transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold text-lg text-white">Ordra</span>
            <span className="font-body text-sm text-lp-zinc">
              © 2026 AxisVale Systems Pvt. Ltd.
            </span>
          </div>

          <div className="flex items-center gap-4">
            {socials.map(({ icon: Icon, href }) => (
              <a
                key={Icon.displayName}
                href={href}
                className="text-lp-zinc hover:text-white transition-colors duration-200"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
