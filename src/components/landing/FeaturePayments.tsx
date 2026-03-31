import { CreditCard, CheckCircle, UserCheck, Eye } from "lucide-react";
import { AnimateIn } from "./AnimateIn";

function PaymentMockup() {
  const filters = ["All", "Paid", "Partial", "Pending"];
  const rows = [
    { dist: "Star Distributors", date: "Mar 27", amount: "₹24,000", mode: "UPI", status: "Pending", color: "#EF4444" },
    { dist: "Kerala Traders", date: "Mar 25", amount: "₹18,500", mode: "Cash", status: "Partial", color: "#F59E0B" },
    { dist: "Prime Agencies", date: "Mar 20", amount: "₹42,000", mode: "Bank", status: "Pending", color: "#EF4444" },
  ];

  return (
    <div className="rounded-xl border border-[#1E1E2C] bg-[#16161F] p-5 md:p-6">
      <div className="text-sm font-medium text-[#F2F2F5] mb-4">Payment Tracker</div>

      <div className="flex gap-2 mb-4">
        {filters.map((f, i) => (
          <div
            key={f}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              i === 3 ? "bg-[#3D6FFF] text-white" : "bg-[#0F0F18] text-[#8888A0] border border-[#1E1E2C]"
            }`}
          >
            {f}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[#1E1E2C] overflow-hidden mb-4">
        <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-[#0F0F18] text-[10px] text-[#55556A] uppercase tracking-wider">
          <div>Distributor</div><div>Date</div><div>Amount</div><div>Mode</div><div>Status</div>
        </div>
        {rows.map((r) => (
          <div key={r.dist} className="grid grid-cols-5 gap-2 px-3 py-2.5 text-xs border-t border-[#1E1E2C]">
            <div className="text-[#F2F2F5]">{r.dist}</div>
            <div className="text-[#8888A0]">{r.date}</div>
            <div className="text-[#F2F2F5]">{r.amount}</div>
            <div className="text-[#8888A0]">{r.mode}</div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium w-fit" style={{ backgroundColor: r.color + "20", color: r.color }}>
              {r.status}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-[#0F0F18] border border-[#F59E0B]/30 p-4 flex items-center justify-between">
        <span className="text-sm text-[#8888A0]">Total Outstanding</span>
        <span className="text-xl font-bold text-[#F59E0B]">₹84,500</span>
      </div>
    </div>
  );
}

export function FeaturePayments() {
  const features = [
    { icon: CreditCard, text: "Payment mode — Cash, UPI, Bank Transfer, Cheque" },
    { icon: CheckCircle, text: "Status — Paid, Partial, Pending on every order" },
    { icon: UserCheck, text: "Accountant role with payment-only access" },
    { icon: Eye, text: "Total pending amount always visible on dashboard" },
  ];

  return (
    <section className="py-24 md:py-32 px-6 bg-[#0F0F18]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <AnimateIn>
            <PaymentMockup />
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-[#55556A] font-semibold mb-4">
                04 / Payments
              </div>
              <h2 className="text-3xl md:text-[40px] font-bold text-[#F2F2F5] leading-tight mb-4">
                Never lose track of who owes what.
              </h2>
              <p className="text-base text-[#8888A0] leading-[1.7] mb-8">
                Every order has a payment status — Paid, Partial, or Pending. Your accountant gets their
                own view to monitor outstanding amounts without touching order data. Follow up faster.
                Close books easier.
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
