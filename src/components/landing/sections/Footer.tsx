import { Linkedin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { spring, staggerContainer, fadeUp } from "@/lib/motion";
import { MagneticWrapper } from "@/components/landing/MagneticWrapper";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import awsLogo from "@/assets/aws-logo.png";
import { Nilavilakku } from "@/components/landing/Nilavilakku";

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
  { icon: Linkedin, href: "https://www.linkedin.com/in/asha-ps-6b0673207/", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="relative bg-[#FAFAFC] pt-24 md:pt-28 pb-12 border-t border-[#0A0F1C]/[0.06] overflow-hidden">
      {/* Layered ambient wash */}
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(79,70,229,0.08) 0%, rgba(245,158,11,0.04) 45%, transparent 75%)",
        }}
      />
      {/* Top hairline gradient */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0A0F1C]/10 to-transparent pointer-events-none"
      />
      {/* Subtle film grain */}
      <div className="lp-noise absolute inset-0 pointer-events-none opacity-40" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-6 md:px-8 lg:px-10">
        {/* Brand block — top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={spring.premium}
          className="mb-14 md:mb-16 max-w-md"
        >
          <Link to="/" className="font-heading font-semibold text-2xl tracking-[-0.04em] text-foreground">
            Ledge
          </Link>
          <p className="font-body text-[14px] text-[#52525B] leading-[1.6] mt-3">
            The order-to-dispatch system for Indian FMCG. Built by an owner, for owners.
          </p>
          {/* Live now pulse */}
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#0A0F1C]/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-6px_rgba(15,23,42,0.08)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-body text-[12px] font-medium text-[#3F3F46]">
              Live now · Owners onboarding this week
            </span>
          </div>

          {/* Talk to Sales — Phone + WhatsApp dual CTA */}
          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <a
              href="tel:+918138084689"
              className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#0A0F1C]/[0.08] hover:border-[#0A0F1C]/[0.18] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-6px_rgba(15,23,42,0.10)] transition-all duration-200"
              aria-label="Call Ledge sales"
            >
              <Phone size={13} className="text-foreground" strokeWidth={2.2} />
              <span className="font-body text-[13px] font-medium text-foreground tracking-[-0.005em]">
                +91 81380 84689
              </span>
            </a>
            <a
              href="https://wa.me/918138084689?text=Hi%20Ledge%2C%20I%27d%20like%20to%20learn%20more"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/15 hover:border-[#25D366]/50 transition-all duration-200"
              aria-label="Chat with Ledge on WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#128C7E]" />
              <span className="font-body text-[13px] font-medium text-[#0F5132] tracking-[-0.005em]">
                WhatsApp Sales
              </span>
            </a>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer(0.06)}
        >
          {columns.map((col) => (
            <motion.div key={col.title} variants={fadeUp} transition={spring.default}>
              <h4 className="font-body font-semibold text-[12px] tracking-[0.08em] text-foreground/70 uppercase mb-4">
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
                          className="font-body text-[13.5px] text-[#52525B] hover:text-foreground transition-colors duration-200"
                        >
                          {link}
                        </a>
                      ) : (
                        <Link
                          to={href}
                          className="font-body text-[13.5px] text-[#52525B] hover:text-foreground transition-colors duration-200"
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
            <h4 className="font-body font-semibold text-[12px] tracking-[0.08em] text-foreground/70 uppercase mb-1">
              Status
            </h4>

            <div className="rounded-2xl border border-[#0A0F1C]/[0.06] bg-white/70 backdrop-blur-sm p-3.5 sm:p-4 flex flex-col gap-3 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_24px_-16px_rgba(15,23,42,0.06)] min-w-0">
              {/* Animated status badge */}
              <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-[#E8E5E0] shadow-sm w-fit max-w-full overflow-hidden">
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 3s linear infinite",
                  }}
                />
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="font-body text-[11.5px] font-medium text-[#3F3F46] relative leading-tight min-w-0">
                  All systems operational
                </span>
              </div>

              {/* AWS infrastructure line */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <img src={awsLogo} alt="AWS" className="h-3.5 w-auto grayscale opacity-50 shrink-0" />
                <span className="font-body text-[12px] text-[#71717A]">
                  Hosted on AWS · Mumbai
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#0A0F1C]/[0.06] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="font-body text-[12.5px] text-[#52525B] flex items-center gap-1.5 leading-tight">
              <Nilavilakku />
              <span>Crafted with intention in God's Own Country · Kerala</span>
            </span>
            <span className="font-body text-[11.5px] text-[#A1A1AA] leading-tight">
              © 2026 Ledge. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {socials.map(({ icon: Icon, href, label }) => (
              <MagneticWrapper key={href} strength={6} radius={60}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/80 border border-[#0A0F1C]/[0.06] flex items-center justify-center text-[#71717A] hover:text-foreground hover:bg-white transition-colors duration-200 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-6px_rgba(15,23,42,0.08)]"
                  aria-label={label}
                >
                  <Icon size={16} />
                </a>
              </MagneticWrapper>
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
