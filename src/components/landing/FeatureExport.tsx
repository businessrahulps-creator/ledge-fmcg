import { FileDown, MessageCircle, Filter, FileText } from "lucide-react";
import { AnimateIn } from "./AnimateIn";

function ExportMockup() {
  return (
    <div className="rounded-xl border border-[#1E1E2C] bg-[#16161F] p-5 md:p-6">
      <div className="text-sm font-medium text-[#F2F2F5] mb-4">Order #ORD-2026-0084</div>

      <div className="rounded-lg border border-[#1E1E2C] bg-[#0F0F18] p-4 mb-4">
        <div className="flex justify-between text-xs mb-3">
          <div>
            <div className="text-[#55556A]">Distributor</div>
            <div className="text-[#F2F2F5]">Kerala Traders</div>
          </div>
          <div className="text-right">
            <div className="text-[#55556A]">Date</div>
            <div className="text-[#F2F2F5]">Mar 28, 2026</div>
          </div>
        </div>

        <div className="rounded border border-[#1E1E2C] overflow-hidden mb-3">
          <div className="grid grid-cols-4 gap-2 px-3 py-1.5 text-[10px] text-[#55556A] uppercase tracking-wider bg-[#16161F]">
            <div>Product</div><div>Qty</div><div>Price</div><div>Total</div>
          </div>
          {[
            { p: "Masala Mix", q: "120", pr: "₹80", t: "₹9,600" },
            { p: "Rice Flour", q: "40", pr: "₹70", t: "₹2,800" },
          ].map((item) => (
            <div key={item.p} className="grid grid-cols-4 gap-2 px-3 py-1.5 text-xs text-[#F2F2F5] border-t border-[#1E1E2C]">
              <div>{item.p}</div><div>{item.q}</div><div>{item.pr}</div><div>{item.t}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#8888A0]">Total</span>
          <span className="font-bold text-[#F2F2F5]">₹12,400</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-[#55556A]">Payment</span>
          <span className="text-[#22C55E]">Paid via UPI</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 h-10 rounded-lg bg-[#16161F] border border-[#1E1E2C] text-xs text-[#F2F2F5] flex items-center justify-center gap-2 hover:border-[#2E2E3E] transition-colors">
          <FileDown size={14} /> Export PDF
        </button>
        <button className="flex-1 h-10 rounded-lg bg-[#16161F] border border-[#1E1E2C] text-xs text-[#F2F2F5] flex items-center justify-center gap-2 hover:border-[#2E2E3E] transition-colors">
          <FileText size={14} /> Export Excel
        </button>
        <button className="flex-1 h-10 rounded-lg bg-[#22C55E]/15 text-[#22C55E] text-xs flex items-center justify-center gap-2 hover:bg-[#22C55E]/25 transition-colors">
          <MessageCircle size={14} /> WhatsApp
        </button>
      </div>
    </div>
  );
}

export function FeatureExport() {
  const features = [
    { icon: FileDown, text: "Export orders as PDF or Excel" },
    { icon: MessageCircle, text: "WhatsApp share — formatted order summary, one tap" },
    { icon: Filter, text: "Filter before export — by date, distributor, product" },
    { icon: FileText, text: "Clean, readable output every time" },
  ];

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <AnimateIn>
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-[#55556A] font-semibold mb-4">
                05 / Export & Share
              </div>
              <h2 className="text-3xl md:text-[40px] font-bold text-[#F2F2F5] leading-tight mb-4">
                Share orders in one tap. Export reports in seconds.
              </h2>
              <p className="text-base text-[#8888A0] leading-[1.7] mb-8">
                Export your full order history or reports as PDF or Excel. Or tap the WhatsApp button to
                instantly share a formatted order summary with anyone on your team.
              </p>
              <div className="space-y-4">
                {features.map((f) => (
                  <div key={f.text} className="flex items-start gap-3">
                    <f.icon size={20} className="text-[#3D6FFF] mt-0.5 shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-[#8888A0]">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <ExportMockup />
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
