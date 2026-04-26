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
    <section className="relative lp-mesh-dark py-28 md:py-36 overflow-hidden">
      {/* Dot grid */}
      <div className="absolute inset-0 lp-grid-soft-dark pointer-events-none" />
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden pointer-events-none">
        <div className="lp-shimmer-line" />
      </div>
      {/* Grain */}
      <div className="absolute inset-0 lp-noise pointer-events-none opacity-30" />

      <div className="relative max-w-6xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow-dark mb-5">The Outcome</span>
            <h2 className="font-heading font-extrabold text-[34px] md:text-[50px] text-white tracking-[-0.04em] leading-[1.05] mt-5">
              What changes in
              <br />
              the first 90 days.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto" staggerTime={0.06}>
          {outcomes.map((o) => (
            <StaggerItem key={o.value} variant="scaleUp">
              <div className="lp-card-dark p-7 md:p-8 h-full flex flex-col">
                <div
                  className="font-heading font-extrabold text-[42px] md:text-[56px] tracking-[-0.045em] leading-[0.95]"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #C4B5FD 0%, #A78BFA 35%, #818CF8 65%, #60A5FA 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 24px rgba(167,139,250,0.35))",
                  }}
                >
                  {o.value}
                </div>
                <div className="font-body text-[14px] md:text-[15px] text-white/65 leading-[1.5] mt-4">
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
          className="font-heading text-[17px] md:text-[20px] text-white/75 text-center mt-16 md:mt-20 max-w-2xl mx-auto tracking-tight"
        >
          Same factory. Same field. <span className="text-white font-semibold">More throughput. Better cash flow.</span>
        </motion.p>
      </div>
    </section>
  );
}
