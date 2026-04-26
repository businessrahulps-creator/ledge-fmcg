import { motion } from "framer-motion";
import { Building2, Target, Users, Shield, Mail } from "lucide-react";
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

const sections = [
  {
    icon: Building2,
    title: "About Us",
    content: [
      "Ledge is a cloud-based platform for Indian businesses that run both a factory floor and a field sales team.",
      "We built Ledge because most teams in India are still managing orders through WhatsApp messages, shared spreadsheets, and manual follow-ups — tools that were never designed for this job. The result is missed orders, payment gaps, and no real visibility into what is happening on the ground.",
      "Ledge replaces that friction with a single, structured platform where teams can capture orders, track payments, manage dealers, and monitor stock — all in real time, from any device.",
    ],
  },
  {
    icon: Target,
    title: "What We Do",
    content: [
      "Ledge gives business owners a clear view of their operations from order to payment. Sales managers see what their teams are doing. Accountants track outstanding payments without chasing anyone. Field reps place orders in seconds without paperwork.",
      "Every company on Ledge gets its own isolated workspace, with role-based access ensuring that each team member sees exactly what they need to do their job.",
    ],
  },
  {
    icon: Users,
    title: "Who We Built This For",
    content: [
      "Ledge is designed for Indian manufacturers, distributors, and brands with field sales teams operating across multiple regions. Strong fit for FMCG, building materials, agri-inputs, auto-parts, and consumer goods. Whether you have a team of three or three hundred, Ledge scales with your operations.",
    ],
  },
  {
    icon: Shield,
    title: "Our Commitment",
    content: [
      "We are committed to building software that is simple enough for a field sales rep to use on a phone and powerful enough for a management team to make decisions from. No unnecessary complexity. No enterprise bloat.",
    ],
  },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
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
            About Us
          </motion.h1>
          <motion.p
            className="mt-4 font-body text-lg text-[#52525B] max-w-xl mx-auto"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            Built for Indian business owners who run both factory and field.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-6 space-y-14">
          {sections.map((s, idx) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              custom={0}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F4F5]">
                  <s.icon size={20} className="text-[#1A1A1A]" />
                </div>
                <h2 className="font-heading font-bold text-xl text-[#1A1A1A]">
                  {s.title}
                </h2>
              </div>
              <div className="space-y-4 pl-[52px]">
                {s.content.map((p, i) => (
                  <p key={i} className="font-body text-[15px] text-[#52525B] leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
              {idx < sections.length - 1 && (
                <hr className="mt-14 border-[#E8E5E0]" />
              )}
            </motion.div>
          ))}

          {/* Get in Touch */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0}
          >
            <hr className="mb-14 border-[#E8E5E0]" />
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F4F5]">
                <Mail size={20} className="text-[#1A1A1A]" />
              </div>
              <h2 className="font-heading font-bold text-xl text-[#1A1A1A]">
                Get in Touch
              </h2>
            </div>
            <div className="pl-[52px] space-y-4">
              <p className="font-body text-[15px] text-[#52525B] leading-relaxed">
                We would love to hear from you — whether you have a question, a feature request, or want to see how Ledge fits your business.
              </p>
              <div className="font-body text-[15px] text-[#52525B] space-y-1">
                <p>
                  Email:{" "}
                  <a href="mailto:ashaoviyaps@gmail.com" className="text-[#1A1A1A] underline underline-offset-2">
                    ashaoviyaps@gmail.com
                  </a>
                </p>
                <p>
                  Website:{" "}
                  <a href="https://getledge.in" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] underline underline-offset-2">
                    getledge.in
                  </a>
                </p>
              </div>
              <a
                href="mailto:ashaoviyaps@gmail.com"
                className="inline-flex items-center bg-[#27272A] text-white px-8 py-3 rounded-full font-body font-semibold text-sm hover:bg-[#1A1A1A] transition-colors duration-200 mt-2"
              >
                Get in Touch
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
