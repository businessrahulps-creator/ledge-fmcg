import { Linkedin, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const columns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Updates"],
  },
  {
    title: "Company",
    links: ["About Us", "Contact"],
  },
  {
    title: "Resources",
    links: ["Help Center", "WhatsApp Support", "Setup Guide"],
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
    <footer className="bg-white py-16 border-t border-fog">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-body font-semibold text-[14px] text-midnight uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    {link === "Privacy Policy" ? (
                      <Link
                        to="/privacy-policy"
                        className="font-body text-[14px] text-graphite hover:text-midnight transition-colors duration-200"
                      >
                        {link}
                      </Link>
                    ) : (
                      <a
                        href="#"
                        className="font-body text-[14px] text-graphite hover:text-midnight transition-colors duration-200"
                      >
                        {link}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-fog flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="font-heading font-extrabold text-lg tracking-[-0.04em] text-midnight">Ledge</span>
            <span className="font-body text-sm text-lp-zinc">
              © 2026 Ledge. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-4">
            {socials.map(({ icon: Icon, href }) => (
              <a
                key={Icon.displayName}
                href={href}
                className="text-lp-zinc hover:text-midnight transition-colors duration-200"
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
