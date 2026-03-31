import { useRef } from "react";
import { useInView } from "framer-motion";
import { AnimateIn, useCountUp } from "./AnimateIn";

function StatBlock({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useCountUp(value, isInView);

  return (
    <div ref={ref} className="text-center px-8">
      <div className="text-4xl md:text-[40px] font-bold text-[#F2F2F5] mb-1">
        {count}{suffix}
      </div>
      <div className="text-sm text-[#8888A0]">{label}</div>
    </div>
  );
}

export function SocialProofBar() {
  return (
    <section className="py-12 bg-[#0F0F18] border-y border-[#1E1E2C]">
      <div className="max-w-[1200px] mx-auto px-6">
        <AnimateIn>
          <p className="text-center text-base md:text-lg text-[#8888A0] mb-10">
            Ordra is helping <span className="text-[#F2F2F5] font-medium">FMCG teams</span> replace spreadsheets and WhatsApp chaos.
          </p>
        </AnimateIn>

        <AnimateIn delay={0.15}>
          <div className="flex flex-col md:flex-row items-center justify-center divide-y md:divide-y-0 md:divide-x divide-[#1E1E2C]">
            <StatBlock value={500} suffix="+" label="Orders tracked daily" />
            <StatBlock value={3} suffix="" label="Roles built for your whole team" />
            <StatBlock value={14} suffix="" label="Days free to start, no card needed" />
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
