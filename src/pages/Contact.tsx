import { Navbar } from "@/components/landing/sections/Navbar";
import { Footer } from "@/components/landing/sections/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-midnight mb-6">
          Contact Us
        </h1>
        <p className="font-body text-graphite leading-relaxed mb-6">
          Have a question, need support, or want to see Ledge in action? We would love to hear from you.
        </p>
        <p className="font-body text-graphite leading-relaxed mb-6">
          <span className="font-semibold text-midnight">Email us at:</span>{" "}
          <a
            href="mailto:ashaoviyaps@gmail.com"
            className="text-ink underline hover:text-ink-light transition-colors"
          >
            ashaoviyaps@gmail.com
          </a>
        </p>
        <p className="font-body text-graphite leading-relaxed">
          We typically respond within 1–2 business days.
        </p>
      </main>
      <Footer />
    </div>
  );
}
