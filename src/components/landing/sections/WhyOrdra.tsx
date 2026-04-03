import { AnimateIn } from "../AnimateIn";

const blocks = [
  {
    title: "Your team will actually open it.",
    content:
      "Most B2B software looks like a government portal from 2011. Ordra looks like something you'd actually want to use. Beautiful tools get used. Ugly tools get abandoned. Your field team will open Ordra because it's fast, clean, and doesn't waste their time.",
  },
  {
    title: "Installs in 30 seconds. No IT department.",
    content:
      "Send your salesperson a link. They tap 'Add to Home Screen.' That's it. Full app on their phone. Works on any Android — even a ₹8,000 Redmi. Works on iPhone. Works on desktop. Updates happen automatically.",
  },
  {
    title: "Built here. For here.",
    content:
      "₹ is the default currency. UPI and cheque are payment modes, not afterthoughts. Stock is tracked warehouse by warehouse, the way your business actually runs. This isn't software translated from English. It was written here, for here.",
  },
  {
    title: "See everything. Chase nothing.",
    content:
      "The moment your salesperson places an order, you see it. Real-time. Not 'I'll send you the Excel tonight.' Ordra gives you a live picture of your business that updates with every order, every dispatch, every payment.",
  },
];

export function WhyOrdra() {
  return (
    <section className="bg-snow py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            This isn't another ERP you'll abandon in a month.
          </h2>
        </AnimateIn>

        <div className="max-w-3xl mx-auto space-y-12">
          {blocks.map((block, i) => (
            <AnimateIn key={block.title} delay={i * 0.1}>
              <div className="border-l-4 border-ink pl-8">
                <h3 className="font-heading font-bold text-[24px] text-midnight mb-4">
                  {block.title}
                </h3>
                <p className="font-body text-[17px] text-graphite leading-[1.7]">
                  {block.content}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
