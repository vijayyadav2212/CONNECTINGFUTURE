"use client";

import { motion } from "framer-motion";

export default function ProcessTimeline() {
  const steps = [
    {
      step: "01",
      title: "Establish Pedigree Credentials",
      desc: "Authenticate securely via modern single sign-on models. Delineate your academic trajectories with instant identity validation."
    },
    {
      step: "02",
      title: "Engage in 1-on-1 Sessions",
      desc: "Schedule mock evaluations, resume feedback syncs, and roadmap guidance directly with verified senior advisors."
    },
    {
      step: "03",
      title: "Unlock Direct Referrals",
      desc: "Circumvent standard hiring queues. Access active vacancies shared directly by alumni in elite target organizations."
    }
  ];

  return (
    <section id="timeline" className="py-24 bg-white px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-block bg-teal-50 text-teal-800 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider mb-2">
            Our Process
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-teal-950">Simple 3-Step Journey</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="space-y-4 group bg-[#f6f3eb] p-8 rounded-2xl border border-teal-900/5"
            >
              <div className="text-5xl font-bold text-teal-800/20 group-hover:text-teal-800 transition-colors duration-300 font-mono">{step.step}</div>
              <h4 className="text-xl font-bold text-teal-955">{step.title}</h4>
              <p className="text-teal-900/70 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
