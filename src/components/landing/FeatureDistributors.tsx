import { Users, History, DollarSign, Search } from "lucide-react";
import { AnimateIn } from "./AnimateIn";

function DistributorMockup() {
  const rows = [
    { name: "Kerala Traders", loc: "Thrissur", orders: 24, value: "₹1,42,000" },
    { name: "Star Distributors", loc: "Kozhikode", orders: 18, value: "₹98,400" },
    { name: "Prime Agencies", loc: "Kochi", orders: 31, value: "₹2,14,000" },
  ];

  return (
    <div className="rounded-xl border border-[#1E1E2C] bg-[#16161F] p-5 md:p-6">
      <div className="text-sm font-medium text-[#F2F2F5] mb-4">Distributors</div>

      {/* Table */}
      <div className="rounded-lg border border-[#1E1E2C] overflow-hidden mb-5">
        <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-[#0F0F18] text-[10px] text-[#55556A] uppercase tracking-wider">
          <div>Name</div><div>Location</div><div>Orders</div><div>Total Value</div>
        </div>
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs border-t border-[#1E1E2C]">
            <div className="text-[#F2F2F5] font-medium">{r.name}</div>
            <div className="text-[#8888A0]">{r.loc}</div>
            <div className="text-[#8888A0]">{r.orders}</div>
            <div className="text-[#F2F2F5]">{r.value}</div>
          </div>
        ))}
      </div>

      {/* Profile card */}
      <div className="rounded-lg border border-[#3D6FFF]/30 bg-[#0F0F18] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-[#F2F2F5]">Kerala Traders</div>
            <div className="text-xs text-[#8888A0]">Thrissur, Kerala</div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E]">Active</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-[#55556A]">Phone</div>
            <div className="text-[#F2F2F5]">+91 98765 XXXXX</div>
          </div>
          <div>
            <div className="text-[#55556A]">Total Orders</div>
            <div className="text-[#F2F2F5]">24</div>
          </div>
          <div>
            <div className="text-[#55556A]">Total Value</div>
            <div className="text-[#F2F2F5]">₹1,42,000</div>
          </div>
        </div>
        <div className="mt-3 text-[10px] text-[#55556A]">Last Order: Mar 28, 2026</div>
      </div>
    </div>
  );
}

export function FeatureDistributors() {
  const features = [
    { icon: Users, text: "Distributor profiles with location and contact" },
    { icon: History, text: "Full order history per distributor" },
    { icon: DollarSign, text: "Total business value per distributor" },
    { icon: Search, text: "Filter and search across your entire network" },
  ];

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <AnimateIn>
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-[#55556A] font-semibold mb-4">
                03 / Distributors
              </div>
              <h2 className="text-3xl md:text-[40px] font-bold text-[#F2F2F5] leading-tight mb-4">
                Every distributor. Every order. One place.
              </h2>
              <p className="text-base text-[#8888A0] leading-[1.7] mb-8">
                Maintain a complete profile for each distributor — their location, contact details, and
                the full history of every order they've placed. Know your best customers without digging
                through files.
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
            <DistributorMockup />
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
