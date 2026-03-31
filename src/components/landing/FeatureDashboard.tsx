import { BarChart3, TrendingUp, Star, AlertCircle } from "lucide-react";
import { AnimateIn } from "./AnimateIn";

function DashboardAnalyticsMockup() {
  const barData = [
    { month: "Oct", value: 58, amount: "₹2.8L" },
    { month: "Nov", value: 64, amount: "₹3.1L" },
    { month: "Dec", value: 83, amount: "₹4.0L" },
    { month: "Jan", value: 75, amount: "₹3.6L" },
    { month: "Feb", value: 87, amount: "₹4.2L" },
    { month: "Mar", value: 100, amount: "₹4.8L" },
  ];

  const donutSegments = [
    { label: "Paid", pct: 68, color: "#22C55E" },
    { label: "Partial", pct: 18, color: "#F59E0B" },
    { label: "Pending", pct: 14, color: "#EF4444" },
  ];

  // SVG donut math
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="rounded-xl border border-[#1E1E2C] bg-[#16161F] p-5 md:p-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Total Sales", value: "₹4,82,000", sub: "↑ +12% this month", subColor: "#22C55E" },
          { label: "Orders", value: "84", sub: "↑ +7 this week", subColor: "#22C55E" },
          { label: "Pending", value: "₹92,400", sub: "Outstanding", subColor: "#F59E0B" },
          { label: "Delivered", value: "71", sub: "This month", subColor: "#22C55E" },
        ].map((k) => (
          <div key={k.label} className="p-3 rounded-lg bg-[#0F0F18] border border-[#1E1E2C]">
            <div className="text-[10px] text-[#55556A] uppercase tracking-wider">{k.label}</div>
            <div className="text-xl font-bold text-[#F2F2F5] mt-1">{k.value}</div>
            <div className="text-[10px] mt-1" style={{ color: k.subColor }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="p-4 rounded-lg bg-[#0F0F18] border border-[#1E1E2C] mb-6">
        <div className="text-sm font-medium text-[#F2F2F5] mb-4">Monthly Sales — Last 6 Months</div>
        <div className="flex items-end gap-3 h-28">
          {barData.map((b) => (
            <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[8px] text-[#55556A]">{b.amount}</div>
              <div className="w-full rounded-t bg-[#3D6FFF]" style={{ height: `${b.value}%` }} />
              <div className="text-[9px] text-[#55556A]">{b.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Donut chart */}
      <div className="p-4 rounded-lg bg-[#0F0F18] border border-[#1E1E2C]">
        <div className="text-sm font-medium text-[#F2F2F5] mb-4">Payment Status</div>
        <div className="flex items-center gap-8">
          <svg width="100" height="100" viewBox="0 0 100 100">
            {donutSegments.map((seg) => {
              const dashLen = (seg.pct / 100) * circ;
              const el = (
                <circle
                  key={seg.label}
                  cx="50" cy="50" r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={`${dashLen} ${circ - dashLen}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 50 50)"
                />
              );
              offset += dashLen;
              return el;
            })}
          </svg>
          <div className="space-y-2">
            {donutSegments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: seg.color }} />
                <span className="text-[#8888A0]">{seg.label}</span>
                <span className="text-[#F2F2F5] font-medium">{seg.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureDashboard() {
  const features = [
    { icon: BarChart3, text: "Sales summary — today, this week, this month" },
    { icon: Star, text: "Top 5 distributors by order value" },
    { icon: TrendingUp, text: "Top 5 products by quantity sold" },
    { icon: AlertCircle, text: "Pending payment amount at a glance" },
  ];

  return (
    <section className="py-24 md:py-32 px-6 bg-[#0F0F18]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <AnimateIn>
            <DashboardAnalyticsMockup />
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-[#55556A] font-semibold mb-4">
                02 / Analytics
              </div>
              <h2 className="text-3xl md:text-[40px] font-bold text-[#F2F2F5] leading-tight mb-4">
                Know exactly where your business stands.
              </h2>
              <p className="text-base text-[#8888A0] leading-[1.7] mb-8">
                Your dashboard shows total sales, pending payments, top distributors, and best-selling
                products — updated the moment a new order is logged. No manual reports. No end-of-month
                surprises.
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
        </div>
      </div>
    </section>
  );
}
