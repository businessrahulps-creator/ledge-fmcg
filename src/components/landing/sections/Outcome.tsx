import { motion } from "framer-motion";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const outcomes = [
  { value: "80+ hrs", label: "Recovered every month across your team" },
  { value: "₹10L–₹1Cr", label: "Revenue leak recovered every year" },
  { value: "8–12%", label: "Sales lift. Same team, same dealers." },
  { value: "₹10K–₹20K", label: "Saved monthly on accountant outsourcing" },
];

export function Outcome() {
  return (
    <section className="relative bg-[#0A0F1C] py-32 md:py-44 overflow-hidden">
      {/* Cool gradient wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 30%, rgba(124,58,237,0.20) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(37,99,235,0.18) 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <span className="inline-block font-body text-[12px] font-semibold tracking-[0.18em] brand-gradient-cool-text uppercase mb-5">
              The Outcome
            </span>
            <h2 className="font-heading font-extrabold text-[36px] md:text-[60px] text-white tracking-[-0.04em] leading-[1.05]">
              What changes in
              <br />
              the first 90 days.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14 max-w-6xl mx-auto">
          {outcomes.map((o) => (
            <StaggerItem key={o.value}>
              <div className="text-center md:text-left">
                <div className="font-heading font-extrabold text-[56px] md:text-[76px] brand-gradient-cool-text tracking-[-0.05em] leading-[0.95]">
                  {o.value}
                </div>
                <div className="font-body text-[15px] md:text-[16px] text-white/70 leading-[1.45] mt-4 max-w-[220px] mx-auto md:mx-0">
                  {o.label}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="font-heading text-[18px] md:text-[22px] text-white/80 text-center mt-20 max-w-2xl mx-auto tracking-tight"
        >
          Same factory. Same field. <span className="text-white font-semibold">More throughput. Better cash flow.</span>
        </motion.p>
      </div>
    </section>
  );
}
