import { Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { spring, staggerContainer, fadeUp } from "@/lib/motion";
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

export function Footer() {
  return (
    <footer className="relative bg-[#FAFAFC] py-24 md:py-28 border-t border-[#0A0F1C]/[0.06]">
      {/* Top hairline gradient */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0A0F1C]/10 to-transparent pointer-events-none"
      />
      {/* Subtle film grain */}
      <div className="lp-noise absolute inset-0 pointer-events-none opacity-40" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-6 md:px-8 lg:px-10">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer(0.06)}
        >
          {columns.map((col) => (
            <motion.div key={col.title} variants={fadeUp} transition={spring.default}>
              <h4 className="font-body font-semibold text-[12px] tracking-[0.08em] text-[#0A0F1C]/70 uppercase mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => {
                  const href = linkMap[link] || "/";
                  const isAnchor = href.startsWith("/#");
                  return (
                    <li key={link}>
                      {isAnchor ? (
                        <a
                          href={href.replace("/", "")}
                          className="font-body text-[13.5px] text-[#52525B] hover:text-[#0A0F1C] transition-colors duration-200"
                        >
                          {link}
                        </a>
                      ) : (
                        <Link
                          to={href}
                          className="font-body text-[13.5px] text-[#52525B] hover:text-[#0A0F1C] transition-colors duration-200"
                        >
                          {link}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ))}

          {/* Status & Infrastructure column */}
          <motion.div
            variants={fadeUp}
            transition={spring.default}
            className="flex flex-col gap-3"
          >
            <h4 className="font-body font-semibold text-[12px] tracking-[0.08em] text-[#0A0F1C]/70 uppercase mb-1">
              Status
            </h4>

            <div className="rounded-2xl border border-[#0A0F1C]/[0.06] bg-white/70 backdrop-blur-sm p-4 flex flex-col gap-3 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_24px_-16px_rgba(15,23,42,0.06)]">
              {/* Animated status badge */}
              <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-[#E8E5E0] shadow-sm w-fit overflow-hidden">
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 3s linear infinite",
                  }}
                />
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="font-body text-[11.5px] font-medium text-[#3F3F46] relative whitespace-nowrap">
                  All systems operational
                </span>
              </div>

              {/* AWS infrastructure line */}
              <div className="flex items-center gap-1.5">
                <img src={awsLogo} alt="AWS" className="h-3.5 w-auto grayscale opacity-50" />
                <span className="font-body text-[12px] text-[#71717A]">
                  Hosted on AWS • Asia Pacific (Mumbai)
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="mt-16 pt-8 border-t border-[#0A0F1C]/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-heading font-extrabold text-lg tracking-[-0.04em] text-[#1A1A1A]">Ledge</Link>
            <div className="flex flex-col gap-0.5">
              <span className="font-body text-[12.5px] text-[#52525B] flex items-center gap-1.5 leading-tight">
                <Nilavilakku />
                <span>Built in God's Own Country · Kerala</span>
              </span>
              <span className="font-body text-[11.5px] text-[#A1A1AA] leading-tight">
                © 2026 Ledge. All rights reserved.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {socials.map(({ icon: Icon, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/70 border border-[#0A0F1C]/[0.06] flex items-center justify-center text-[#71717A] hover:text-[#0A0F1C] hover:bg-white transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Icon size={16} />
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
