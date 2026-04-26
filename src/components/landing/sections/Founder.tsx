import { motion } from "framer-motion";
import { useState } from "react";
import { AnimateIn } from "../AnimateIn";
import ashaPhoto from "@/assets/asha-ps-founder.webp";
import ashaPhotoBlur from "@/assets/asha-ps-founder-blur.webp";

export function Founder() {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="bg-white py-24 md:py-32 lg:py-36">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Photo */}
          <AnimateIn className="lg:col-span-5">
            <div className="relative max-w-[400px] mx-auto lg:mx-0">
              {/* Soft neutral shadow */}
              <div
                aria-hidden
                className="absolute -inset-4 rounded-[2.5rem] blur-2xl opacity-30"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 60%, rgba(15,23,42,0.20) 0%, transparent 65%)",
                }}
              />
              {/* Inner ring + image */}
              <div
                className="relative rounded-[2rem] overflow-hidden bg-[#F4F4F8] aspect-[4/5]"
                style={{
                  boxShadow:
                    "inset 0 0 0 1px rgba(15,23,42,0.06), 0 24px 60px -16px rgba(15,23,42,0.18)",
                }}
              >
                {/* LQIP blur background — instant, sub-1KB */}
                <img
                  src={ashaPhotoBlur}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: "blur(20px) saturate(1.2)",
                    transform: "scale(1.1)",
                  }}
                />
                {/* Sharp image — crossfades in once decoded */}
                <img
                  src={ashaPhoto}
                  alt="Asha Ps, Founder of Ledge"
                  width={800}
                  height={1200}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setLoaded(true)}
                  className={`relative w-full h-full object-cover transition-opacity duration-700 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
                />
              </div>
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
              className="font-heading font-medium text-[20px] md:text-[24px] text-[#0A0F1C] leading-[1.5] tracking-[-0.01em] mt-6"
            >
              "I built Ledge because I watched too many Indian business owners juggle a factory on one side and a field team on the other. The software ignored both.
              <br /><br />
              Your team is in the field right now. Your floor is running. Your business deserves a system that keeps up. Built in India. Designed for the way you actually work.
              <br /><br />
              <span className="text-[#4F46E5] font-semibold">Start free. If it's not running your business in 30 days, walk away.</span>"
            </motion.p>

            <div className="mt-8">
              <p className="font-heading font-semibold text-[15.5px] text-[#0A0F1C]">Asha Ps</p>
              <div className="h-px w-7 bg-[#0A0F1C] mt-1.5" />
              <p className="font-body text-[13px] text-[#64748B] mt-1.5">Founder, Ledge</p>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
