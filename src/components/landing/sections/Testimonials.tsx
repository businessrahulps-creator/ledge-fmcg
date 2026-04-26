import { motion } from "framer-motion";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const testimonials = [
  {
    quote: "I check the dashboard before I start my day. That's it. The whole operation used to live in my head.",
    name: "Arnav Sethi",
    role: "Owner, Aryan Beverages, Pune",
  },
  {
    quote: "I showed my team Ledge on Monday. By Wednesday, the Excel file hadn't been opened once.",
    name: "Priya Anand",
    role: "Operations Head, Coastal Naturals, Kochi",
  },
  {
    quote: "Caught a critical low on our top SKU four days early. Festival season went perfectly.",
    name: "Dev Sharma",
    role: "Warehouse Lead, Nova Retail Co., Chennai",
  },
  {
    quote: "I open the dealer profile in the car. I walk in knowing everything. Dealers notice.",
    name: "Rohan Nair",
    role: "Senior Sales Executive, Sterling FMCG, Bangalore",
  },
];

export function Testimonials() {
  return (
    <section className="bg-[#F5F6F8] py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-block font-body text-[12px] font-semibold tracking-[0.18em] text-[#7C3AED] uppercase mb-4">
              From the field
            </span>
            <h2 className="font-heading font-extrabold text-[32px] md:text-[52px] text-[#0A0F1C] tracking-[-0.04em] leading-[1.05]">
              Owners who stopped guessing.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <StaggerItem key={t.name} variant="scaleUp">
              <motion.div
                className="bg-white rounded-2xl p-8 md:p-10 border border-[#E5E7EB] h-full flex flex-col"
                whileHover={{ y: -4, boxShadow: "0 12px 32px -8px rgba(10,15,28,0.10)" }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <p className="font-heading font-bold text-[20px] md:text-[22px] text-[#0A0F1C] leading-[1.35] tracking-[-0.02em] flex-1">
                  "{t.quote}"
                </p>
                <div className="mt-7 pt-5 border-t border-[#E5E7EB]">
                  <p className="font-body font-semibold text-[15px] text-[#0A0F1C]">
                    {t.name}
                  </p>
                  <p className="font-body text-[13px] text-[#64748B] mt-0.5">{t.role}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
