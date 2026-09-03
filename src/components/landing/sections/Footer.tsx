import { Linkedin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { spring, staggerContainer, fadeUp } from "@/lib/motion";
import { MagneticWrapper } from "@/components/landing/MagneticWrapper";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { WA_GREEN, WA_GREEN_DARK, WA_TEXT } from "@/components/landing/constants";
import awsLogo from "@/assets/aws-logo.png";
import ledgeLogo from "@/assets/ledge-logo.webp";


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
    <footer className="relative lp-footer lp-section-paper pt-20 md:pt-24 pb-10 border-t border-border overflow-hidden">
      {/* Layered ambient wash — Midnight + Terracotta */}
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(var(--accent) / 0.06) 0%, hsl(var(--primary) / 0.04) 45%, transparent 75%)",
        }}
      />
      {/* Top hairline gradient */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none"
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
          <Link to="/" aria-label="Ledge home" className="inline-flex items-center">
            <img src={ledgeLogo} alt="Ledge" width={220} height={64} className="h-16 w-auto" decoding="async" loading="lazy" />
          </Link>
          <p className="font-body text-[14px] text-muted-foreground leading-[1.6] mt-3">
            Orders. Payments. Stock. Invoices. Reports. One effortless mobile experience — built for India's FMCG super-stockists.
          </p>
          {/* Live now pulse */}
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-depth-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]" />
            </span>
            <span className="font-body text-[12px] font-medium text-foreground/80">
              Live now · Owners onboarding this week
            </span>
          </div>

          {/* Talk to Sales — Phone + WhatsApp dual CTA */}
          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <a
              href="tel:+918714249485"
              className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-card border border-border hover:border-primary/30 shadow-depth-2 transition-all duration-200"
              aria-label="Call Ledge sales"
            >
              <Phone size={13} className="text-foreground" strokeWidth={2.2} />
              <span className="font-body text-[13px] font-medium text-foreground tracking-[-0.005em]">
                +91 87142 49485
              </span>
            </a>
            <a
              href="https://wa.me/918714249485?text=Hi%20Ledge%2C%20I%27d%20like%20to%20learn%20more"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-200"
              style={{ backgroundColor: `${WA_GREEN}1a`, borderColor: `${WA_GREEN}4d`, borderWidth: 1, borderStyle: "solid" }}
              aria-label="Chat with Ledge on WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" style={{ color: WA_GREEN_DARK }} />
              <span className="font-body text-[13px] font-medium tracking-[-0.005em]" style={{ color: WA_TEXT }}>
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
                          className="font-body text-[13.5px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          {link}
                        </a>
                      ) : (
                        <Link
                          to={href}
                          className="font-body text-[13.5px] text-muted-foreground hover:text-foreground transition-colors duration-200"
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

            <div className="rounded-lp-xs border border-border bg-card/70 backdrop-blur-sm p-3.5 sm:p-4 flex flex-col gap-3 shadow-depth-2 min-w-0">
              {/* Animated status badge */}
              <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-card border border-border shadow-depth-2 w-fit max-w-full overflow-hidden">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(var(--success))]" />
                </span>
                <span className="font-body text-[11.5px] font-medium text-foreground/80 relative leading-tight min-w-0">
                  All systems operational
                </span>
              </div>

              {/* AWS infrastructure line */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <img src={awsLogo} alt="AWS" width={36} height={14} className="h-3.5 w-auto grayscale opacity-50 shrink-0" />
                <span className="font-body text-[12px] text-muted-foreground">
                  Hosted on AWS · Mumbai
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="font-body text-[12.5px] text-muted-foreground leading-tight">
              Designed and engineered in Kerala, India.
            </span>
            <span className="font-body text-[11.5px] text-muted-foreground/70 leading-tight">
              © 2026 Ledge. All rights reserved.
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
