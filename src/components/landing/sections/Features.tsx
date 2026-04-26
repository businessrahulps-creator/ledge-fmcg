import { LayoutDashboard, Route, Contact, Warehouse, IndianRupee, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const features = [
  { icon: LayoutDashboard, title: "Live business dashboard", desc: "Today's revenue, orders, dispatches. The moment you log in." },
  { icon: Route, title: "Order lifecycle, tracked", desc: "Pending → Dispatched → Delivered. Every step logged." },
  { icon: Contact, title: "Dealer intelligence", desc: "Lifetime value, outstanding, full history. One profile." },
  { icon: Warehouse, title: "Stock health alerts", desc: "Green, amber, red. Per SKU, per godown. Never face a stockout." },
  { icon: IndianRupee, title: "Payments tracked properly", desc: "Cash, UPI, cheque, bank. All reconciled in one place." },
  { icon: Layers, title: "Schemes, targets, claims", desc: "The whole ops layer. Not just orders." },
];

export function Features() {
  return (
    <section id="features" className="bg-[#F5F6F8] py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-block font-body text-[12px] font-semibold tracking-[0.18em] text-[#7C3AED] uppercase mb-4">
              Features
            </span>
            <h2 className="font-heading font-extrabold text-[32px] md:text-[52px] text-[#0A0F1C] tracking-[-0.04em] leading-[1.05]">
              Everything your business needs.
              <br />
              Nothing it doesn't.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.div
                className="bg-white border border-[#E5E7EB] rounded-2xl p-8 transition-shadow duration-300 h-full flex flex-col"
                whileHover={{ y: -4, boxShadow: "0 12px 32px -8px rgba(10,15,28,0.10)" }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <div className="w-11 h-11 rounded-xl bg-[#F5F6F8] flex items-center justify-center mb-6">
                  <feature.icon size={22} strokeWidth={1.75} className="text-[#7C3AED]" />
                </div>
                <h3 className="font-heading font-bold text-[20px] text-[#0A0F1C] mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="font-body text-[15px] text-[#64748B] leading-[1.55]">
                  {feature.desc}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
