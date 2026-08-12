"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Rohan Mehra",
      role: "SDE-2 at Amazon",
      initials: "RM",
      text: "The platform's alumni directory directly connected me with an engineering manager who guided me through coding rounds."
    },
    {
      name: "Tanya Sharma",
      role: "Alumni / Senior PM at Stripe",
      initials: "TS",
      text: "I love hosting mentorship sessions. It is incredibly streamlined to give back to the university students and help them level up."
    },
    {
      name: "Amit Patel",
      role: "Student, CS",
      initials: "AP",
      text: "Securing a referral through our alumni network was a game changer for me. The resume review feedback was extremely detailed."
    }
  ];

  return (
    <section id="about" className="py-24 bg-[#f6f3eb] px-6">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-block bg-teal-50 text-teal-800 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider mb-2">
            Testimonials
          </div>
          <h3 className="text-4xl font-bold text-teal-950 font-sans">Happy Clients</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="bg-white rounded-2xl p-8 border border-teal-900/5 relative flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#000000] text-black" />
                ))}
              </div>
              <p className="text-teal-900/80 text-xs italic leading-relaxed mb-6 font-sans">
                {t.text}
              </p>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="w-8 h-8 rounded-full bg-[#0f4c5c] flex items-center justify-center text-xs font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <h5 className="font-bold text-slate-805 text-xs">{t.name}</h5>
                  <p className="text-[10px] text-slate-450">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
