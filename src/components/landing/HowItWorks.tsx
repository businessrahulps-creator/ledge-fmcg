import { Building2, Database, ClipboardCheck } from "lucide-react";
import { AnimateIn } from "./AnimateIn";

const steps = [
  {
    num: "01",
    icon: Building2,
    title: "Create your workspace",
    text: "Sign up, add your company details, and set up your team in under 5 minutes.",
  },
  {
    num: "02",
    icon: Database,
    title: "Add your data",
    text: "Add your products, your distributor list, and invite your sales managers.",
  },
  {
    num: "03",
    icon: ClipboardCheck,
    title: "Start capturing orders",
    text: "Log every sale, track every payment, and watch your dashboard come to life.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6 bg-[#0F0F18]">
      <div className="max-w-[1200px] mx-auto">
        <AnimateIn>
          <h2 className="text-3xl md:text-[48px] font-bold text-[#F2F2F5] text-center mb-16 tracking-tight">
            Up and running in minutes.
          </h2>
        </AnimateIn>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-[#1E1E2C]" />

          {steps.map((s, i) => (
            <AnimateIn key={s.num} delay={i * 0.15}>
              <div className="relative rounded-xl border border-[#1E1E2C] bg-[#08080D] p-8">
                <div className="text-[48px] font-bold text-[#1E1E2C] leading-none mb-4">{s.num}</div>
                <s.icon size={24} className="text-[#3D6FFF] mb-4" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-[#F2F2F5] mb-2">{s.title}</h3>
                <p className="text-sm text-[#8888A0] leading-relaxed">{s.text}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
