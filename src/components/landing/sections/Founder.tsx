import { motion } from "framer-motion";
import { useState } from "react";
import { AnimateIn } from "../AnimateIn";
import ashaPhoto from "@/assets/asha-ps-founder.jpg";

export function Founder() {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="bg-white py-28 md:py-40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Photo */}
          <AnimateIn className="lg:col-span-5">
            <div className="relative max-w-[420px] mx-auto lg:mx-0">
              <div
                className="absolute -inset-2 rounded-[2.5rem] blur-2xl opacity-30 brand-gradient-cool-bg"
                aria-hidden
              />
              <div
                className="relative rounded-[2rem] overflow-hidden bg-[#F5F6F8] aspect-[4/5]"
                style={{ boxShadow: "0 24px 60px -16px rgba(10,15,28,0.25)" }}
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
            </div>
          </AnimateIn>

          {/* Note */}
          <AnimateIn delay={0.1} className="lg:col-span-7">
            <span className="inline-block font-body text-[12px] font-semibold tracking-[0.18em] brand-gradient-cool-text uppercase mb-5">
              From the founder
            </span>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="font-heading font-bold text-[24px] md:text-[34px] text-[#0A0F1C] leading-[1.25] tracking-[-0.025em]"
            >
              "I built Ledge because I watched too many Indian business owners juggle a factory on one side and a field team on the other. The software ignored both.
              <br /><br />
              Your team is in the field right now. Your floor is running. Your business deserves a system that keeps up. Built in India. Designed for the way you actually work.
              <br /><br />
              <span className="brand-gradient-cool-text">Start free. If it's not running your business in 30 days, walk away.</span>"
            </motion.p>

            <div className="mt-8 flex items-center gap-4">
              <div>
                <p className="font-heading font-bold text-[16px] text-[#0A0F1C]">Asha Ps</p>
                <p className="font-body text-[14px] text-[#64748B]">Founder, Ledge</p>
              </div>
              <span className="text-[#E5E7EB]">·</span>
              <a
                href="https://wa.me/918138084689"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-[14px] text-[#0A0F1C] font-medium hover:text-[#7C3AED] transition-colors"
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
