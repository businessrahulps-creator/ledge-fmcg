import { AnimateIn } from "../AnimateIn";

const testimonials = [
  {
    quote:
      "I used to run the whole operation from my head - who ordered what, who still owes me, which godown is low. Now it's all in Ledge. I check the dashboard before I start my day. That's it.",
    name: "Arnav Sethi",
    role: "Owner, Aryan Beverages, Pune",
  },
  {
    quote:
      "My team was using three different WhatsApp groups and a shared Excel file to manage orders. I showed them Ledge on a Monday afternoon. By Wednesday, the Excel file hadn't been opened once. No instruction needed - they just used it.",
    name: "Priya Anand",
    role: "Operations Head, Coastal Naturals, Kochi",
  },
  {
    quote:
      "The stock health view changed how I manage godowns. I caught a critical low on our top SKU four days before it would have been a problem. Moved inventory the same evening. Festival season went perfectly. That one call saved us.",
    name: "Dev Sharma",
    role: "Warehouse Lead, Nova Retail Co., Chennai",
  },
  {
    quote:
      "Before Ledge I had to call the office twice before every dealer visit just to check outstanding and last order details. Now I open the dealer profile on my phone in the car. I walk in knowing everything. Dealers notice.",
    name: "Rohan Nair",
    role: "Senior Sales Executive, Sterling FMCG, Bangalore",
  },
];

export function Testimonials() {
  return (
    <section className="bg-indigo-50/20 py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            From owners who stopped guessing.
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
