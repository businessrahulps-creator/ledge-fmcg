import { AnimateIn } from "../AnimateIn";

const blocks = [
  {
    title: "It installs from a link. No app store. No IT department. No training day.",
    content:
      "Ledge is a Progressive Web App. You send your team a URL. They tap \"Add to Home Screen.\" It's on their phone in 90 seconds. Works on any basic Android device. No version updates to manage. No permissions to configure. Start to first live order in under two minutes — we've timed it.",
  },
  {
    title: "It works when the network doesn't.",
    content:
      "Your salesperson is in a basement godown or a market with spotty signal. Ledge keeps working. Orders placed offline go into a queue and sync the moment connectivity returns. Dealer data and product catalogues are cached locally. The field doesn't stop because the internet did.",
  },
  {
    title: "Four roles. One system. Everyone sees exactly what they should.",
    content:
      "The business owner sees everything. The sales manager tracks team performance, targets, and dispatch. The accountant handles payments, invoicing, and GST compliance — without touching inventory quantities. The field salesperson sees their dealers, their orders, their numbers. Role-based access, not role-based chaos.",
  },
  {
    title: "GST-compliant billing that builds itself from your orders.",
    content:
      "Select an order. Choose GST Invoice, Estimate, Proforma, or Credit Note. CGST/SGST for intra-state, IGST for inter-state — auto-calculated from the state codes on the buyer and seller profiles. Amount in words in the Indian numbering system. Sequential invoice numbers with your prefix. PDF generated in one click. Suresh doesn't need to open Tally for this anymore.",
  },
];

export function WhyOrdra() {
  return (
    <section className="bg-white py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            This isn't another ERP your field team will quit in three weeks.
          </h2>
        </AnimateIn>

        <div className="max-w-3xl mx-auto space-y-12">
          {blocks.map((block, i) => (
            <AnimateIn key={block.title} delay={i * 0.1}>
              <div className="border-l-4 border-indigo-500 pl-8">
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
