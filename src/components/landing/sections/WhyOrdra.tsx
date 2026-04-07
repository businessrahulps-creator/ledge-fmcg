import { AnimateIn } from "../AnimateIn";

const blocks = [
  {
    title: "Designed for actual field adoption.",
    content:
      "Heavy software fails when your team refuses to use it. We built an interface so fast and clean that your field force will actually prefer it over their paper order books.",
  },
  {
    title: "Deployed in under thirty seconds.",
    content:
      "Skip the IT department and lengthy setups. Send your team a link, and they can start capturing orders on any smartphone immediately.",
  },
  {
    title: "Built for operational realities.",
    content:
      "We treat UPI payments, multiple warehouses, and basic network connections as absolute defaults, not as corporate afterthoughts.",
  },
  {
    title: "Immediate operational visibility.",
    content:
      "Stop waiting for the evening Excel file. Make critical decisions based on a live feed of your entire distribution network from anywhere.",
  },
];

export function WhyOrdra() {
  return (
    <section className="bg-white py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            This isn't another ERP your team will abandon.
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
