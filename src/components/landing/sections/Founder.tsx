import { motion } from "framer-motion";
import { useState } from "react";
import { AnimateIn } from "../AnimateIn";
import ashaPhoto from "@/assets/asha-ps-founder.jpg";

export function Founder() {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="bg-white py-24 md:py-32 lg:py-36">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Photo */}
          <AnimateIn className="lg:col-span-5">
            <div className="relative max-w-[400px] mx-auto lg:mx-0">
              {/* Soft outer glow */}
              <div
                aria-hidden
                className="absolute -inset-4 rounded-[2.5rem] blur-2xl opacity-35"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 30%, rgba(124,58,237,0.5) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(37,99,235,0.4) 0%, transparent 60%)",
                }}
              />
              {/* Inner ring + image */}
              <div
                className="relative rounded-[2rem] overflow-hidden bg-[#F5F6F8] aspect-[4/5]"
                style={{
                  boxShadow:
                    "inset 0 0 0 1px rgba(124,58,237,0.18), 0 24px 60px -16px rgba(10,15,28,0.25), 0 0 0 1px rgba(255,255,255,0.6)",
                }}
              >
                {!loaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#F5F6F8] to-[#E5E7EB]" />}
                <img
                  src={ashaPhoto}
                  alt="Asha Ps, Founder of Ledge"
                  loading="lazy"
                  onLoad={() => setLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
                />
              </div>
              {/* Corner accent dot */}
              <div
                aria-hidden
                className="absolute -top-2 -right-2 w-4 h-4 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                  boxShadow: "0 0 16px rgba(124,58,237,0.6)",
                }}
              />
            </div>
          </AnimateIn>

          {/* Note */}
          <AnimateIn delay={0.1} className="lg:col-span-7">
            <span className="lp-eyebrow">From the founder</span>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="font-heading font-bold text-[22px] md:text-[28px] text-[#0A0F1C] leading-[1.35] tracking-[-0.02em] mt-6"
            >
              "I built Ledge because I watched too many Indian business owners juggle a factory on one side and a field team on the other. The software ignored both.
              <br /><br />
              Your team is in the field right now. Your floor is running. Your business deserves a system that keeps up. Built in India. Designed for the way you actually work.
              <br /><br />
              <span className="lp-gradient-text-cool">Start free. If it's not running your business in 30 days, walk away.</span>"
            </motion.p>

            <div className="mt-8 flex items-center gap-4">
              <div>
                <p className="font-heading font-bold text-[15.5px] text-[#0A0F1C]">Asha Ps</p>
                <div
                  className="h-[2px] w-7 rounded-full mt-1"
                  style={{ background: "linear-gradient(90deg, #7C3AED, #2563EB)" }}
                />
                <p className="font-body text-[13px] text-[#64748B] mt-1.5">Founder, Ledge</p>
              </div>
              <span className="text-[#E5E7EB]">·</span>
              <a
                href="https://wa.me/918138084689"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-[13.5px] text-[#0A0F1C] font-medium hover:text-[#6D28D9] transition-colors"
              >
                +91 81380 84689
              </a>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
