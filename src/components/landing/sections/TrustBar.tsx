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
    <section className="bg-indigo-50/30 py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Logo Marquee */}
        <div className="overflow-hidden">
          <div className="flex gap-12 animate-marquee w-max items-center">
            {[...companies, ...companies].map((name, i) => (
              <span key={i} className="text-lg font-semibold text-[#C4C4C4] whitespace-nowrap shrink-0">
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
                <div className="font-heading font-extrabold text-[20px] md:text-[24px] text-midnight mb-1">
                  {stat}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* Pull Quote */}
        <AnimateIn delay={0.15} className="mt-12">
          <div className="bg-violet-50/50 rounded-2xl p-8 max-w-2xl mx-auto relative">
            <span className="absolute top-4 left-6 text-6xl font-serif text-indigo-400 opacity-30 leading-none select-none">
              "
            </span>
            <p className="font-body text-lg text-graphite italic leading-[1.7] pl-8">
              The first time I opened Ledge on a Friday evening and just… saw everything — every order, every payment, every dispatch for the week — I realized I'd been running blind for years.
            </p>
            <p className="font-body font-semibold text-midnight mt-4 pl-8">
              Arnav Sethi · Founder, Aryan Beverages, Pune
            </p>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
