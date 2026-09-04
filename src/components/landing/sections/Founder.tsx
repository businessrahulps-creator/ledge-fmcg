import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { AnimateIn } from "../AnimateIn";

export function Founder() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const auraY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-30, 30]);

  return (
    <section id="founder" ref={sectionRef} className="relative lp-section-soft lp-rhythm overflow-hidden">
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
              "radial-gradient(ellipse at center, rgba(245,158,11,0.10) 0%, hsl(var(--accent) / 0.06) 40%, transparent 70%)",
          }}
        />
      </motion.div>

      <div className="relative max-w-3xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn>
          <span className="lp-eyebrow">From the founder</span>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="font-heading font-medium text-[20px] md:text-[24px] text-foreground leading-[1.5] tracking-[-0.01em] mt-6"
          >
            "I built Ledge because I watched too many Indian business owners juggle a factory on one side and a field team on the other. The software ignored both.
            <br /><br />
            Your team is in the field right now. Your floor is running. Your business deserves a system that keeps up. Built in India. Designed for the way you actually work.
            <br /><br />
            <span className="text-primary font-semibold">Start free. If it's not running your business in 30 days, walk away.</span>"
          </motion.p>

          <div className="mt-8">
            <p className="font-heading font-semibold text-[15.5px] text-foreground">Rahul Ps</p>
            <div className="h-px w-7 bg-primary mt-1.5" />
            <p className="font-body text-[13px] text-muted-foreground mt-1.5">Founder, Ledge</p>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
