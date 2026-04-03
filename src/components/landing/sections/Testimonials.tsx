import { AnimateIn } from "../AnimateIn";

const testimonials = [
  {
    quote:
      "I have 6 salespeople covering Ernakulam, Thrissur, and Palakkad. Before Ordra, I would call each of them around 7pm — 'kitne order aaye aaj?' — and write it down in a diary. Some would pick up, some wouldn't. I'd get the real numbers 2 days late. Now I open the dashboard at 5pm and it's all there. Every order, every dealer, every rupee. My wife says I'm less stressed. She's right.",
    name: "Rajesh Menon",
    role: "Founder, SouthSpice Distributors · Kochi",
  },
  {
    quote:
      "We were paying ₹35,000/month for software my team hated. Training took 3 days. Two of my guys just refused to use it and kept sending WhatsApp messages. I cancelled after 4 months. Ordra? I sent my team a link on Monday morning. By lunch, all 8 were placing orders. Nobody complained. That has literally never happened with any software.",
    name: "Priya Sharma",
    role: "Operations Head, GreenLeaf FMCG · Surat",
  },
  {
    quote:
      "The stock alert saved our Diwali season. 'Kesari Mix 500g' was showing Critical in the Pune godown — 3 days before our biggest ordering week. I would have found out only when a dealer called asking why we short-shipped. Instead, we transferred stock from Nashik same day. That one alert probably saved ₹4-5 lakh in orders.",
    name: "Karthik Sundaram",
    role: "Warehouse Manager, TamilNadu Retail Supply · Coimbatore",
  },
  {
    quote:
      "Main Indore se Ujjain, Dewas, Ratlam cover karta hoon. Signal toh milta nahi half the time. Pehle WhatsApp pe order bhejta tha — net nahi hai toh message pending mein. Ab Ordra pe order daalta hoon, offline save ho jaata hai. Jaise hi signal aata hai, auto send. Mera koi order miss nahi hua 3 months mein.",
    name: "Deepak Yadav",
    role: "Field Sales · MadhyaBharat Foods · Indore",
    translationNote:
      "(I cover Indore to Ujjain, Dewas, Ratlam. Half the time there's no signal. Now I enter orders on Ordra offline, they sync automatically. Haven't missed a single order in 3 months.)",
  },
];

export function Testimonials() {
  return (
    <section className="bg-cream py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            Our product speaks for itself.
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={t.name}>
              <AnimateIn delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-8 border border-fog h-full">
                  <span className="font-heading font-extrabold text-6xl text-violet opacity-20 leading-none block mb-2">
                    "
                  </span>
                  <p className="font-body text-base text-graphite leading-[1.7]">
                    {t.quote}
                  </p>
                  <div className="mt-6 pt-6 border-t border-fog">
                    <p className="font-body font-bold text-base text-midnight">
                      {t.name}
                    </p>
                    <p className="font-body text-sm text-lp-zinc">{t.role}</p>
                  </div>
                </div>
              </AnimateIn>
              {t.translationNote && (
                <p className="font-body text-sm text-lp-zinc italic mt-3 px-2">
                  {t.translationNote}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
