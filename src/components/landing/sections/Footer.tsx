import { Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import awsLogo from "@/assets/aws-logo.png";

const linkMap: Record<string, string> = {
  "Features": "/#features",
  "Pricing": "/#pricing",
  "About Us": "/about-us",
  "Contact": "/contact",
  "Privacy Policy": "/privacy-policy",
  "Terms of Service": "/terms-of-service",
  "Refund Policy": "/refund-policy",
};

const columns = [
  { title: "Product", links: ["Features", "Pricing"] },
  { title: "Company", links: ["About Us", "Contact"] },
  { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Refund Policy"] },
];

const socials = [
  { icon: Linkedin, href: "https://www.linkedin.com/in/asha-ps-6b0673207/" },
];

function AwsLogo() {
  return (
    <svg width="20" height="12" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
      <path d="M11.2 17.6c-3.7 2.7-9 4.2-13.6 4.2-6.4 0-12.2-2.4-16.6-6.3-.3-.3 0-.7.4-.5 4.7 2.8 10.6 4.4 16.6 4.4 4.1 0 8.6-.8 12.7-2.6.6-.2 1.1.4.5.8z" transform="translate(18 4)" fill="#A1A1AA"/>
      <path d="M12.8 15.9c-.5-.6-3.1-.3-4.3-.1-.4 0-.4-.3-.1-.5 2.1-1.5 5.5-1.1 5.9-.6.4.5-.1 4.1-2.1 5.8-.3.3-.6.1-.5-.2.5-1.2 1.5-3.8 1.1-4.4z" transform="translate(18 4)" fill="#A1A1AA"/>
      <path d="M8.6 2.6V.9c0-.3.2-.4.4-.4h7.5c.3 0 .4.2.4.4v1.4c0 .2-.2.5-.6 1.1l-3.9 5.5c1.4 0 3 .2 4.3.9.3.2.4.4.4.7v1.8c0 .3-.3.6-.6.4-2.5-1.3-5.9-1.5-8.7 0-.3.1-.6-.1-.6-.4V10c0-.3 0-.8.3-1.3l4.5-6.4H8.9c-.2 0-.4-.2-.4-.4v-.3z" transform="translate(0 4)" fill="#A1A1AA"/>
      <path d="M27 12.4h-2.3c-.2 0-.4-.2-.4-.4V.9c0-.2.2-.4.4-.4h2.1c.2 0 .4.2.4.4v1.6h0c.5-1.5 1.6-2.2 3-2.2 1.4 0 2.3.7 2.9 2.2.5-1.5 1.8-2.2 3.1-2.2 1 0 2 .4 2.6 1.3.7 1 .6 2.4.6 3.6v7.2c0 .2-.2.4-.4.4h-2.3c-.2 0-.4-.2-.4-.4V6c0-.5 0-1.7-.1-2.2-.1-.8-.6-1-1.2-1-.5 0-1 .3-1.2.9-.2.5-.2 1.4-.2 2.3v6c0 .2-.2.4-.4.4h-2.3c-.2 0-.4-.2-.4-.4V6c0-1.3.2-3.2-1.3-3.2-1.5 0-1.4 1.9-1.4 3.2v6c0 .2-.2.4-.4.4z" transform="translate(-4 4)" fill="#A1A1AA"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#F8F7F5] py-16 border-t border-[#E8E5E0]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-body font-semibold text-[14px] text-[#1A1A1A] uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => {
                  const href = linkMap[link] || "/";
                  const isAnchor = href.startsWith("/#");
                  return (
                    <li key={link}>
                      {isAnchor ? (
                        <a
                          href={href.replace("/", "")}
                          className="font-body text-[14px] text-[#71717A] hover:text-[#1A1A1A] transition-colors duration-200"
                        >
                          {link}
                        </a>
                      ) : (
                        <Link
                          to={href}
                          className="font-body text-[14px] text-[#71717A] hover:text-[#1A1A1A] transition-colors duration-200"
                        >
                          {link}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Status & Infrastructure column */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", damping: 26, stiffness: 200, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <h4 className="font-body font-semibold text-[14px] text-[#1A1A1A] uppercase tracking-wider mb-0">
              Status
            </h4>

            {/* Animated status badge */}
            <div className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#E8E5E0] shadow-sm w-fit overflow-hidden">
              {/* Shimmer overlay */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 3s linear infinite",
                }}
              />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-body text-[13px] font-medium text-[#3F3F46] relative">
                All systems operational
              </span>
            </div>

            {/* AWS infrastructure line */}
            <div className="flex items-center gap-1.5">
              <AwsLogo />
              <span className="font-body text-[12px] text-[#A1A1AA]">
                Hosted on AWS · Asia Pacific (Mumbai)
              </span>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E8E5E0] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-heading font-extrabold text-lg tracking-[-0.04em] text-[#1A1A1A]">Ledge</Link>
            <span className="font-body text-sm text-[#71717A]">
              © 2026 Ledge. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-4">
            {socials.map(({ icon: Icon, href }) => (
              <a
                key={href}
                href={href}
                className="text-[#71717A] hover:text-[#1A1A1A] transition-colors duration-200"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </footer>
  );
}
