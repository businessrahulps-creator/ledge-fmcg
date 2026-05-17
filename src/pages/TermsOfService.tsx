import { SeoHead } from "@/components/SeoHead";
import { Navbar } from "@/components/landing/sections/Navbar";
import { Footer } from "@/components/landing/sections/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white font-body antialiased scroll-smooth">
      <SeoHead
        title="Terms of Service — Ledge"
        description="The terms that govern your use of the Ledge platform at getledge.in. Read these before creating an account or running your business on Ledge."
        path="/terms-of-service"
      />
      <Navbar />
      <section className="pt-28 pb-14 md:pt-36 md:pb-20 bg-[#F8F7F5]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl tracking-[-0.04em] text-[#1A1A1A]">
            Terms of Service
          </h1>
          <p className="font-body text-[#52525B] mt-4">
            Last updated: April 7, 2026
          </p>
        </div>
      </section>
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <p className="text-[#52525B] leading-relaxed mb-8">
          These Terms of Service ("Terms") govern your use of the Ledge platform at getledge.in, operated by Ledge (India) ("Ledge", "we", "our", or "us"). By creating an account or using the platform, you agree to these Terms.
        </p>

        <hr className="border-[#E8E5E0] my-10" />

        <Section title="Who Can Use Ledge">
          <p>
            You must be at least 18 years old and authorised to enter into agreements on behalf of your company. By signing up, you confirm that the information you provide is accurate and that you have the authority to bind your organisation to these Terms.
          </p>
        </Section>

        <Section title="Your Account">
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. If you suspect unauthorised access, notify us immediately at <strong>ashaoviyaps@gmail.com</strong>.
          </p>
          <p>
            Each company on Ledge gets an isolated workspace. Sharing credentials across organisations or attempting to access another company's data is not permitted.
          </p>
        </Section>

        <Section title="Subscription Plans">
          <p>Ledge offers the following plans:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Free</strong> — ₹0/month. Up to 3 users, 50 orders/month, 1 warehouse, basic dashboard.</li>
            <li><strong>Growth</strong> — ₹2,499/month. Up to 15 users, unlimited orders, multi-warehouse, dealer analytics, payment tracking.</li>
            <li><strong>Scale</strong> — ₹5,999/month. Unlimited users, advanced reports, custom permissions, dedicated support.</li>
            <li><strong>Enterprise</strong> — Custom pricing. Tally/SAP integrations, multi-brand support, and on-premise options. Contact us for a quote.</li>
          </ul>
          <p className="mt-4">
            Paid plans include a <strong>30-day free trial</strong>. No payment is charged during the trial. You can cancel before the trial ends at no cost.
          </p>
        </Section>

        <Section title="Billing">
          <p>
            Subscriptions are billed monthly in Indian Rupees (INR). Fees are charged at the start of each billing cycle. Applicable taxes, including GST, will be added as required by law.
          </p>
          <p>
            There are no setup fees and no annual lock-in. You can cancel at any time. See our Refund Policy for what happens when you cancel.
          </p>
        </Section>

        <Section title="Acceptable Use">
          <p>You agree to use Ledge only for lawful business purposes. You must not:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Upload or transmit content that is unlawful, fraudulent, or infringes on anyone's rights</li>
            <li>Attempt to access another company's workspace or the underlying platform infrastructure</li>
            <li>Reverse-engineer or attempt to extract the platform's source code</li>
            <li>Use automated scripts or bots in ways that disrupt the service</li>
            <li>Resell or sublicense access to the platform without our written consent</li>
          </ul>
          <p className="mt-4">Violations may result in immediate suspension or termination of your account.</p>
        </Section>

        <Section title="Your Data">
          <p>
            You own all the business data you enter into Ledge. We do not claim any rights over it. By using the platform, you grant us a limited licence to store and process your data solely for the purpose of providing the service.
          </p>
          <p>
            We will never use your business data for advertising, AI training, or any purpose unrelated to running the platform for you.
          </p>
        </Section>

        <Section title="Our Intellectual Property">
          <p>
            All software, design, branding, and documentation that make up the Ledge platform belong to Ledge (India). Your subscription gives you the right to use the platform — it does not transfer any ownership of our intellectual property to you.
          </p>
        </Section>

        <Section title="Platform Availability">
          <p>
            We aim to keep Ledge available and reliable, but we cannot guarantee uninterrupted access. Scheduled maintenance, updates, and events outside our control may occasionally affect availability. We will communicate planned downtime in advance where possible.
          </p>
          <p>The platform currently requires an active internet connection.</p>
        </Section>

        <Section title="Changes to the Platform or These Terms">
          <p>
            We may update the platform or these Terms from time to time. For material changes, we will give you at least 14 days' notice via email or in-app notification. Continued use of the platform after the effective date means you accept the updated Terms.
          </p>
        </Section>

        <Section title="Suspension and Termination">
          <p>
            We may suspend or terminate your account if you breach these Terms, fail to pay your subscription fees after reasonable notice, or engage in fraudulent activity.
          </p>
          <p>
            You may cancel your account at any time through the platform settings or by emailing <strong>ashaoviyaps@gmail.com</strong>. After termination, your data is retained for 60 days so you can export it, after which it is permanently deleted.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <p>
            To the extent permitted by Indian law, Ledge's total liability to you will not exceed the fees you paid in the three months prior to the event giving rise to the claim. We are not liable for indirect losses, loss of profits, or loss of data arising from your use of the platform.
          </p>
        </Section>

        <Section title="Governing Law">
          <p>
            These Terms are governed by the laws of India. Any disputes that cannot be resolved amicably will be subject to the exclusive jurisdiction of the courts in Kerala, India.
          </p>
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
