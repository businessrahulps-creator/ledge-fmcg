import { useState } from "react";
import { Check } from "lucide-react";
import { BillingToggle, BillingPrice } from "@/components/arc/billing-toggle/billing-toggle";
import { Section, SectionHead, Reveal, Btn } from "../kit";

const plans = [
  { name: "Free", monthly: 0, tagline: "Try it on your business.", features: ["3 users", "50 orders / month", "1 warehouse", "Dashboard + orders", "Dealer catalogue"], cta: "Start Free", highlighted: false },
  { name: "Growth", monthly: 2499, tagline: "Replace the spreadsheet.", features: ["Up to 15 users", "Unlimited orders", "Multi-warehouse stock alerts", "Full dealer profiles", "Payment tracking, all modes", "Schemes & targets", "GST invoices, PDFs", "CSV reports"], cta: "Start Free Trial", highlighted: true },
  { name: "Scale", monthly: 5999, tagline: "Multiple teams, serious volume.", features: ["Unlimited users", "Everything in Growth", "5 report modules", "Targets per salesperson", "Claims & returns workflow", "Secondary sales tracking", "Audit trail", "Priority support"], cta: "Start Free Trial", highlighted: false },
];

/** Yearly = pay 10 months for 12, shown as the monthly equivalent. */
const yearlyPerMonth = (m: number) => Math.round((m * 10) / 12);

export function Pricing() {
  const [period, setPeriod] = useState("monthly");
  const yearly = period === "yearly";
  return (
    <Section id="pricing" ground="light" labelledBy="pricing-title">
      <SectionHead
        num="09"
        eyebrow="Pricing"
        id="pricing-title"
        title="The offer that makes saying no feel irrational."
        lines={["The offer that makes saying no", "feel irrational."]}
        lede={<>Competitors charge ₹5,000–₹15,000+. Ledge delivers more for 50–80% less. <span className="lpx-strong">Commit 1 year → pay only 10 months. Two months free.</span></>}
      />

      <Reveal>
        <div className="flex flex-col items-center gap-4 -mt-2 mb-10 md:mb-12">
          <BillingToggle
            value={period}
            onValueChange={setPeriod}
            label="Billing period"
            options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly", badge: "2 months free" }]}
          />
          <p className="text-[13px] lpx-muted">30-day free trial · No card · Cancel anytime</p>
        </div>
      </Reveal>

      <div className="lpx-grid lpx-grid-3 max-w-5xl mx-auto">
        {plans.map((p, i) => {
          const amount = yearly ? yearlyPerMonth(p.monthly) : p.monthly;
          return (
            <Reveal key={p.name} delay={i * 0.06}>
              <div className={`lpx-card ${p.highlighted ? "lpx-plan--featured" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="lpx-h3 text-[19px]">{p.name}</h3>
                  {p.highlighted && <span className="lpx-tag">Most popular</span>}
                </div>
                <p className="text-[14px] lpx-muted mt-1">{p.tagline}</p>
                <div className="mt-6 lpx-price">
                  <BillingPrice amount={amount} currency="₹" period={yearly && p.monthly ? "/month, billed yearly" : "/month"} was={yearly && p.monthly ? p.monthly : undefined} />
                </div>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] leading-[1.45]">
                      <span className="lpx-check"><Check size={11} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8"><Btn to="/signup" ghost={!p.highlighted} block>{p.cta}</Btn></div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <p className="text-center mt-10 text-[14px]">
        <a
          className="lpx-link"
          href="https://wa.me/918714249485?text=Hi%2C%20I%27d%20like%20to%20discuss%20a%20custom%20Ledge%20plan%20for%20my%20business."
          target="_blank"
          rel="noopener noreferrer"
        >
          Need something custom - Tally/SAP, on-prem, multi-brand? Chat on WhatsApp →
        </a>
      </p>
    </Section>
  );
}
