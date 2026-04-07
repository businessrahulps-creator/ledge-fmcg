import { AnimateIn } from "../AnimateIn";

const testimonials = [
  {
    quote:
      "I used to call six team members every evening just to know what we sold. Now I open the dashboard at 5 PM and see every order and payment. My family says I am noticeably less stressed.",
    name: "Rajesh Menon",
    role: "Owner, SouthSpice Distributors · Kochi",
  },
  {
    quote:
      "We paid a premium for legacy software, but my team hated it and kept reverting to WhatsApp. I sent them the Ledge link, and by lunch, all eight were using it without a single complaint.",
    name: "Priya Radhakrishnan",
    role: "Operations Head, GreenLeaf Naturals · Madurai",
  },
  {
    quote:
      "A critical stock alert saved our festival season. We moved inventory from our Salem warehouse the same day, saving us lakhs in potential lost orders.",
    name: "S. Prakash",
    role: "Warehouse Manager, TamilNadu Retail Supply · Tiruppur",
  },
  {
    quote:
      "Earlier, I had to call the office for every little detail. Now I see exactly what each dealer needs and their pending payments right on my phone. It saves me hours every week.",
    name: "Murugan K.",
    role: "Field Sales, Deccan Consumer Products · Mysore",
  },
];

export function Testimonials() {
  return (
    <section className="bg-indigo-50/20 py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            Run by business owners who demand clarity.
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={t.name} className="h-full">
              <AnimateIn delay={i * 0.1} className="h-full">
                <div className="bg-white rounded-2xl p-8 border border-indigo-100 h-full flex flex-col">
                  <span className="font-heading font-extrabold text-6xl text-indigo-400 opacity-30 leading-none block mb-2">
                    "
                  </span>
                  <p className="font-body text-base text-graphite leading-[1.7] flex-1">
                    {t.quote}
                  </p>
                  <div className="mt-6 pt-6 border-t border-indigo-50">
                    <p className="font-body font-bold text-base text-midnight">
                      {t.name}
                    </p>
                    <p className="font-body text-sm text-lp-zinc">{t.role}</p>
                  </div>
                </div>
              </AnimateIn>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
