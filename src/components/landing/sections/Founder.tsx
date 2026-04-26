import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useState, useRef } from "react";
import { AnimateIn } from "../AnimateIn";
import ashaPhoto from "@/assets/asha-ps-founder.webp";
import ashaPhotoBlur from "@/assets/asha-ps-founder-blur.webp";

export function Founder() {
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);
  const auraY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-30, 30]);

  return (
    <section ref={sectionRef} className="relative bg-white py-24 md:py-32 lg:py-36 overflow-hidden">
      {/* Soft section ambient wash */}
      <motion.div
        aria-hidden
        style={{ y: auraY }}
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[860px] h-[860px] pointer-events-none opacity-70"
      >
        <div
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(245,158,11,0.10) 0%, rgba(79,70,229,0.06) 40%, transparent 70%)",
          }}
        />
      </motion.div>

      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Photo */}
          <AnimateIn className="lg:col-span-5">
            <motion.div
              style={{ y: photoY }}
              className="relative max-w-[400px] mx-auto lg:mx-0"
            >
              {/* Breathing ambient aura — warm */}
              <motion.div
                aria-hidden
                className="absolute -inset-10 rounded-[3rem] blur-3xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 40% 50%, rgba(245,158,11,0.28) 0%, rgba(79,70,229,0.14) 45%, transparent 75%)",
                }}
                animate={reduce ? undefined : { opacity: [0.55, 0.85, 0.55], scale: [1, 1.04, 1] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Cool counter-glow */}
              <div
                aria-hidden
                className="absolute -inset-4 rounded-[2.5rem] blur-2xl opacity-40 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 60% 70%, rgba(15,23,42,0.22) 0%, transparent 65%)",
                }}
              />

              {/* Polaroid frame */}
              <div
                className="relative rounded-[2rem] bg-white p-3 pb-4"
                style={{
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 80px -20px rgba(15,23,42,0.28), 0 10px 30px -12px rgba(15,23,42,0.18)",
                }}
              >
                {/* Inner ring + image */}
                <div
                  className="relative rounded-[1.5rem] overflow-hidden bg-[#F4F4F8] aspect-[4/5]"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
                >
                  {/* LQIP blur */}
                  <img
                    src={ashaPhotoBlur}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: "blur(20px) saturate(1.2)", transform: "scale(1.1)" }}
                  />
                  {/* Sharp image */}
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
                  {/* Soft top sheen */}
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
                    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)" }}
                  />
                </div>

                {/* Brass corner accents */}
                <span aria-hidden className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#C9A55C]/60 rounded-tl-[1.25rem]" />
                <span aria-hidden className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#C9A55C]/60 rounded-tr-[1.25rem]" />
                <span aria-hidden className="absolute bottom-3 left-2 w-4 h-4 border-b-2 border-l-2 border-[#C9A55C]/60 rounded-bl-[1.25rem]" />
                <span aria-hidden className="absolute bottom-3 right-2 w-4 h-4 border-b-2 border-r-2 border-[#C9A55C]/60 rounded-br-[1.25rem]" />
              </div>
            </motion.div>
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
