import { Navbar } from "@/components/landing/sections/Navbar";
import { Footer } from "@/components/landing/sections/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white font-body antialiased scroll-smooth">
      <Navbar />
      <section className="pt-28 pb-14 md:pt-36 md:pb-20 bg-[#F8F7F5]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl tracking-[-0.04em] text-[#1A1A1A]">
            Privacy Policy
          </h1>
          <p className="font-body text-[#52525B] mt-4">
            Last updated: April 7, 2026
          </p>
        </div>
      </section>
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <p className="text-graphite leading-relaxed mb-8">
          Ledge (India) ("Ledge", "we", "our", or "us") operates the Ledge platform at getledge.in. This page explains what data we collect, how we use it, and your rights as a user.
        </p>

        <hr className="border-fog my-10" />

        <Section title="What We Collect">
          <p><strong>Account information</strong> — your name, email address, and password when you sign up.</p>
          <p><strong>Company information</strong> — your company name and your role within the workspace (Super Admin, Sales Manager, Accountant, or Salesperson).</p>
          <p><strong>Business data</strong> — orders, dealer records, product catalogue, stock levels, payment details, and any other information you or your team enters into the platform.</p>
          <p><strong>Usage data</strong> — browser type, device type, IP address, and general usage patterns. This is collected automatically to keep the service running reliably.</p>
        </Section>

        <Section title="How We Use Your Data">
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide, operate, and maintain the Ledge platform</li>
            <li>To verify your identity and enforce access controls</li>
            <li>To send you account-related and service notifications</li>
            <li>To respond to support requests</li>
            <li>To improve the product using aggregated, anonymised insights</li>
          </ul>
          <p className="mt-4">
            We do not sell your data. We do not use your business data to train AI models or for any purpose outside of delivering the service to you.
          </p>
        </Section>

        <Section title="Who We Share Data With">
          <p>
            We work with trusted infrastructure and cloud service providers to operate the platform. These providers process your data strictly on our behalf and are bound by confidentiality obligations. We do not share your data with advertisers, data brokers, or any third party for commercial purposes.
          </p>
          <p>We may disclose data if required by applicable Indian law or a valid court order.</p>
        </Section>

        <Section title="Data Security">
          <p>
            Every company's workspace is fully isolated from others. We use role-based access controls, email verification, and encrypted connections throughout the platform to keep your data secure.
          </p>
        </Section>

        <Section title="Data Retention">
          <p>
            We retain your data for as long as your account is active. Upon account deletion, personal data is removed within 30 days and business data within 60 days.
          </p>
        </Section>

        <Section title="Your Rights">
          <p>Under the Digital Personal Data Protection Act, 2023, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate or incomplete data</li>
            <li>Request deletion of your data</li>
            <li>Raise a grievance about how we handle your data</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, email us at <strong>ashaoviyaps@gmail.com</strong>. We will respond within 30 days.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use only essential session cookies required for login and platform functionality. We do not use advertising or tracking cookies.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            If we make material changes to this policy, we will notify you by email or in-app notice at least 14 days before the changes take effect. Continued use of the platform after that date constitutes acceptance of the updated policy.
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
