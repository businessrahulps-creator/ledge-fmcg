import { motion } from "framer-motion";
import { Mail, Globe } from "lucide-react";
import { SeoHead } from "@/components/SeoHead";
import { Navbar } from "@/components/landing/sections/Navbar";
import { Footer } from "@/components/landing/sections/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 26, stiffness: 200, delay: i * 0.05 },
  }),
};

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SeoHead
        title="Contact Ledge — Talk to Sales for Indian FMCG"
        description="Reach the Ledge team for demos, onboarding help, or partnership questions. Call or WhatsApp +91 81380 84689, or email hello@getledge.in."
        path="/contact"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-14 md:pt-36 md:pb-20 bg-[#F8F7F5]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.h1
            className="font-heading font-extrabold text-4xl md:text-5xl tracking-[-0.04em] text-[#1A1A1A]"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            Contact Us
          </motion.h1>
          <motion.p
            className="mt-4 font-body text-lg text-[#52525B] max-w-xl mx-auto"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            Have a question, need support, or want to see Ledge in action? We'd love to hear from you.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-12 md:py-20">
        <div className="max-w-xl mx-auto px-6">
          <motion.div
            className="bg-white rounded-3xl border border-[#E8E5E0] p-10"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)" }}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F4F5] shrink-0">
                  <Mail size={20} className="text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[16px] text-[#1A1A1A] mb-1">Email</h3>
                  <a
                    href="mailto:ashaoviyaps@gmail.com"
                    className="font-body text-[15px] text-[#52525B] underline underline-offset-2 hover:text-[#1A1A1A] transition-colors"
                  >
                    ashaoviyaps@gmail.com
                  </a>
                </div>
              </div>

              <hr className="border-[#E8E5E0]" />

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F4F5] shrink-0">
                  <Globe size={20} className="text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[16px] text-[#1A1A1A] mb-1">Website</h3>
                  <a
                    href="https://getledge.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-[15px] text-[#52525B] underline underline-offset-2 hover:text-[#1A1A1A] transition-colors"
                  >
                    getledge.in
                  </a>
                </div>
              </div>
            </div>

            <a
              href="mailto:ashaoviyaps@gmail.com"
              className="mt-8 w-full bg-[#27272A] text-white py-3.5 rounded-full font-body font-semibold text-sm hover:bg-[#1A1A1A] transition-colors duration-200 inline-flex items-center justify-center"
            >
              Send us an email
            </a>

            <p className="font-body text-sm text-[#71717A] text-center mt-4">
              We typically respond within 1–2 business days.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
