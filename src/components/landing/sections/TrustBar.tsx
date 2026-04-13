import { AnimateIn } from "../AnimateIn";

const companies = [
  "Aryan Beverages",
  "Nova Retail Co.",
  "Coastal Naturals",
  "Horizon Foods",
  "Sterling FMCG",
  "Crest Agencies",
];

const stats = [
  "₹0 setup cost",
  "4 user roles built-in",
  "Works offline on any phone",
];

export function TrustBar() {
  return (
    <section className="bg-[#F8F7F5] py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        {/* Logo Marquee */}
        <div className="overflow-hidden">
          <div className="flex gap-12 animate-marquee w-max items-center">
            {[...companies, ...companies].map((name, i) => (
              <span key={i} className="text-lg font-semibold text-[#D4D1CC] whitespace-nowrap shrink-0">
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Stat Row */}
        <div className="grid grid-cols-3 max-w-3xl mx-auto text-center mt-12">
          {stats.map((stat, i) => (
            <AnimateIn key={stat} delay={i * 0.1}>
              <div className="text-center px-4">
                <div className="font-heading font-extrabold text-[18px] md:text-[20px] text-[#1A1A1A] mb-1">
                  {stat}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* Pull Quote */}
        <AnimateIn delay={0.15} className="mt-12">
          <div className="bg-white rounded-3xl p-10 max-w-2xl mx-auto relative border border-[#E8E5E0]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)" }}>
            <span className="absolute top-4 left-6 text-6xl font-serif text-[#D4D1CC] opacity-40 leading-none select-none">
              "
            </span>
            <p className="font-body text-lg text-[#52525B] italic leading-[1.75] pl-8">
              The first time I opened Ledge on a Friday evening and just… saw everything - every order, every payment, every dispatch for the week - I realized I'd been running blind for years.
            </p>
            <p className="font-body font-semibold text-[#1A1A1A] mt-4 pl-8">
              Arnav Sethi · Founder, Aryan Beverages, Pune
            </p>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
