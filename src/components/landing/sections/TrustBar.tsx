import { useRef } from "react";
import { useInView } from "framer-motion";
import { AnimateIn, useCountUp } from "../AnimateIn";

function StatBlock({ value, prefix, suffix, label, delay }: { value: number; prefix?: string; suffix?: string; label: string; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useCountUp(value, isInView);

  return (
    <AnimateIn delay={delay}>
      <div ref={ref} className="text-center px-4">
        <div className="font-heading font-extrabold text-[36px] md:text-[48px] text-midnight mb-1">
          {prefix}{count}{suffix}
        </div>
        <div className="font-body text-sm text-lp-zinc">{label}</div>
      </div>
    </AnimateIn>
  );
}

const logos = Array.from({ length: 6 });

export function TrustBar() {
  return (
    <section className="bg-[#FAFAFA] py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Logo Marquee */}
        <div className="overflow-hidden opacity-60">
          <div className="flex gap-8 animate-marquee w-max">
            {[...logos, ...logos].map((_, i) => (
              <div key={i} className="w-24 h-8 bg-fog rounded-lg shrink-0" />
            ))}
          </div>
        </div>

        {/* Stat Row */}
        <div className="grid grid-cols-3 max-w-3xl mx-auto text-center mt-12">
          <StatBlock value={10} prefix="₹" suffix="Cr+" label="Monthly orders managed" delay={0} />
          <StatBlock value={12} suffix="" label="States covered" delay={0.1} />
          <StatBlock value={50} suffix="+" label="FMCG brands onboarded" delay={0.2} />
        </div>

        {/* Pull Quote */}
        <AnimateIn delay={0.15} className="mt-12">
          <div className="bg-cream rounded-2xl p-8 max-w-2xl mx-auto relative">
            <span className="absolute top-4 left-6 text-6xl font-serif text-ink opacity-30 leading-none select-none">
              "
            </span>
            <p className="font-body text-lg text-graphite italic leading-[1.7] pl-8">
              Saturday evening, I opened Ordra and saw every order from the week — dealer-wise, product-wise, payment-wise. First time in 8 years I didn't call a single salesman for updates.
            </p>
            <p className="font-body font-semibold text-midnight mt-4 pl-8">
              Amit Patel · FreshVale Foods, Ahmedabad
            </p>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
