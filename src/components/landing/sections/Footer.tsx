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
    <footer className="bg-[#F8F7F5] py-16 border-t border-[#E8E5E0]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer(0.06)}
        >
          {columns.map((col) => (
            <motion.div key={col.title} variants={fadeUp} transition={spring.default}>
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
            </motion.div>
          ))}

          {/* Status & Infrastructure column */}
          <motion.div
            variants={fadeUp}
            transition={spring.default}
            className="flex flex-col gap-4"
          >
            <h4 className="font-body font-semibold text-[14px] text-[#1A1A1A] uppercase tracking-wider mb-0">
              Status
            </h4>

            {/* Animated status badge */}
            <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-[#E8E5E0] shadow-sm w-fit overflow-hidden">
              {/* Shimmer overlay */}
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
              <span className="font-body text-[11px] font-medium text-[#3F3F46] relative whitespace-nowrap">
                All systems operational
              </span>
            </div>

            {/* AWS infrastructure line */}
            <div className="flex items-center gap-1.5">
              <img src={awsLogo} alt="AWS" className="h-3 w-auto grayscale opacity-50" />
              <span className="font-body text-[12px] text-[#A1A1AA]">
                Hosted on AWS · Asia Pacific (Mumbai)
              </span>
            </div>
          </motion.div>
        </motion.div>

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
                target="_blank"
                rel="noopener noreferrer"
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
