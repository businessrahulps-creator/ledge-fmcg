import { Navbar } from "@/components/landing/sections/Navbar";
import { Footer } from "@/components/landing/sections/Footer";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white font-body antialiased scroll-smooth">
      <Navbar />
      <section className="pt-28 pb-14 md:pt-36 md:pb-20 bg-[#F8F7F5]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl tracking-[-0.04em] text-[#1A1A1A]">
            Refund Policy
          </h1>
          <p className="font-body text-[#52525B] mt-4">
            Last updated: April 7, 2026
          </p>
        </div>
      </section>
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <p className="text-[#52525B] leading-relaxed mb-8">
          This Refund Policy applies to all paid subscriptions on the Ledge platform at getledge.in, operated by Ledge (India) ("Ledge", "we", "our", or "us").
        </p>

        <hr className="border-[#E8E5E0] my-10" />

        <Section title="Free Trial">
          <p>
            All paid plans include a 30-day free trial. No payment is collected during the trial period. You can cancel anytime before the trial ends and you will not be charged.
          </p>
        </Section>

        <Section title="Cancellation">
          <p>
            You can cancel your subscription at any time through the platform settings or by emailing <strong>ashaoviyaps@gmail.com</strong>.
          </p>
          <p>When you cancel:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your subscription remains active until the end of the current billing period</li>
            <li>You will not be charged for the next cycle</li>
            <li>No refund is issued for unused days in the current billing period</li>
          </ul>
        </Section>

        <Section title="When a Refund May Be Issued">
          <p>
            We generally do not offer refunds for subscription fees already paid, given the availability of a free trial before any commitment. However, we will consider a refund in the following situations:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>You were charged after a confirmed cancellation was processed</li>
            <li>A duplicate or incorrect charge occurred due to a billing error on our end</li>
            <li>The platform was unavailable for an extended period due to an issue on our end</li>
          </ul>
        </Section>

        <Section title="How to Request a Refund">
          <p>
            To raise a refund request, email us at <strong>ashaoviyaps@gmail.com</strong> with the subject line <strong>Refund Request — [your account email]</strong>. Include a brief description of the issue and the charge date.
          </p>
          <p>
            We will acknowledge your request and open a support ticket. Approved refunds are processed within <strong>15 working days</strong> of approval and returned to your original payment method.
          </p>
        </Section>

        <Section title="What Is Not Refundable">
          <ul className="list-disc pl-5 space-y-2">
            <li>Unused days remaining after cancellation of a monthly subscription</li>
            <li>Fees incurred during a suspension for violation of our Terms of Service</li>
            <li>Enterprise plan fees, which are governed by a separate agreement</li>
          </ul>
        </Section>

        <Section title="Contact" last>
          <p><strong>Ledge (India)</strong></p>
          <p>Email: ashaoviyaps@gmail.com</p>
          <p>Website: getledge.in</p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <>
      <h2 className="font-heading font-bold text-xl text-[#1A1A1A] mb-4">{title}</h2>
      <div className="text-[#52525B] leading-relaxed space-y-3">{children}</div>
      {!last && <hr className="border-[#E8E5E0] my-10" />}
    </>
  );
}
